from typing import Any

from src.api_client import ApiClient
from src.config import settings
from src.location_resolver import LocationResolver
from src.logger import get_logger
from src.normalizers.reg_normalizer import RegNormalizer
from src.parsers.reg_parser import RegParser
from src.parsers.wasac_parser import WasacParser
from src.sources.reg import RegSource
from src.sources.wasac import WasacSource
from src.storage.duplicate_detector import DuplicateDetector
from src.utility_resolver import UtilityResolver
from src.validators.outage_validator import OutageValidator

logger = get_logger("collector")

REG_OUTAGES_URL = "https://www.reg.rw/customer-service/power-outages/"


def _iso(value: Any) -> Any:
    return value.isoformat() if hasattr(value, "isoformat") else value


class UnifiedCollector:
    """Collects official outage announcements from REG (electricity) and
    WASAC (water) and ingests them into the API."""

    def __init__(self):
        self.reg_source = RegSource()
        self.wasac_source = WasacSource()
        self.location_resolver = LocationResolver()
        self.utility_resolver = UtilityResolver()
        self.api_client = ApiClient()
        self.duplicate_detector = DuplicateDetector()

    async def collect_reg(self) -> list[dict[str, Any]]:
        html = await self.reg_source.fetch_power_outages()
        rows = RegParser.parse(html)
        normalized = []

        for row in rows:
            try:
                raw_outages = RegNormalizer.normalize(
                    row, row.get("source_url") or REG_OUTAGES_URL)
                for outage in raw_outages:
                    ok, errors = OutageValidator.validate(outage.model_dump())
                    if not ok:
                        logger.warning(
                            "REG outage rejected: %s | %s", outage.external_id, errors)
                        continue
                    if self.duplicate_detector.is_duplicate(outage):
                        logger.info(
                            "Skipping duplicate REG outage %s", outage.external_id)
                        continue
                    normalized.append(outage)
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.warning("Failed to normalize REG row %s | %s", row, exc)

        return [outage.model_dump() for outage in normalized]

    async def collect_wasac(self) -> list[dict[str, Any]]:
        html = await self.wasac_source.fetch_announcements()
        return WasacParser.parse(html)

    async def run(self) -> dict[str, Any]:
        created = 0
        duplicates = 0
        unresolved = 0
        failures = 0
        wasac_ingestable = 0

        electricity = await self.utility_resolver.find_by_code("ELECTRICITY")
        water = await self.utility_resolver.find_by_code("WATER")

        if not electricity or not water:
            raise RuntimeError("Utilities not found for collector run")

        # Each source is independent: a failure at REG must not stop WASAC.
        try:
            reg_outages = await self.collect_reg()
            await self.api_client.report_source("REG", REG_OUTAGES_URL, True, len(reg_outages))
        except Exception as exc:
            reg_outages = []
            failures += 1
            logger.exception("REG collection failed: %s", exc)
            await self.api_client.report_source("REG", REG_OUTAGES_URL, False, error=str(exc))

        for outage_data in reg_outages:
            try:
                locations = await self.location_resolver.find_locations(
                    district=outage_data.get("district") or "",
                    areas=outage_data.get("sector") or "",
                )

                if not locations:
                    unresolved += 1
                    logger.warning(
                        "Skipping REG outage with unresolved district: %s (%s)",
                        outage_data.get("external_id"),
                        outage_data.get("district"),
                    )
                    continue

                response = await self.api_client.create_outage(
                    outage=outage_data,
                    location_id=locations[0]["id"],
                    utility_id=electricity["id"],
                    token=None,
                    location_ids=[location["id"] for location in locations],
                )

                if response.get("status") == "duplicate":
                    duplicates += 1
                elif response.get("status") == "created":
                    created += 1
            except Exception as exc:
                failures += 1
                logger.exception("Failed to ingest REG outage: %s", exc)

        try:
            water_announcements = await self.collect_wasac()
            current = sum(1 for item in water_announcements if item.get("status") in {"planned", "active"})
            await self.api_client.report_source("WASAC", WasacParser.OFFICIAL_URL, True, current)
        except Exception as exc:
            water_announcements = []
            failures += 1
            logger.exception("WASAC collection failed: %s", exc)
            await self.api_client.report_source("WASAC", WasacParser.OFFICIAL_URL, False, error=str(exc))

        for item in water_announcements:
            try:
                if item.get("status") not in {"planned", "active"}:
                    logger.info(
                        "Skipping past WASAC announcement %s (%s)",
                        item.get("external_id"),
                        item.get("status"),
                    )
                    continue

                if not item.get("start_time"):
                    logger.info(
                        "Skipping WASAC announcement without an event date: %s",
                        item.get("external_id"),
                    )
                    continue

                districts = item.get("districts") or []
                if not districts:
                    unresolved += 1
                    logger.warning(
                        "Skipping WASAC announcement without a recognised district: %s",
                        item.get("external_id"),
                    )
                    continue

                matched_locations = []
                areas_by_district = item.get("areas_by_district") or {}
                for district in districts:
                    # Named areas resolve to sectors; without them the
                    # district-level location is used.
                    locations = await self.location_resolver.find_locations(
                        district=district,
                        areas=areas_by_district.get(district) or "",
                    )
                    if not locations:
                        logger.warning(
                            "WASAC announcement %s: no location for district %s",
                            item.get("external_id"),
                            district,
                        )
                        continue
                    matched_locations.extend(locations)

                unique_locations = list(
                    {location["id"]: location for location in matched_locations}.values())
                if not unique_locations:
                    unresolved += 1
                    continue

                wasac_ingestable += 1

                # WASAC announces the day but not the hours; the end time is
                # left empty rather than invented.
                payload = {
                    "title": item.get("title") or "Water supply interruption",
                    "description": item.get("description") or item.get("summary") or item.get("title"),
                    "start_time": item["start_time"],
                    "end_time": item.get("end_time"),
                    "status": item.get("status"),
                    "source_type": "official",
                    "source_name": item.get("source_name") or WasacParser.SOURCE_NAME,
                    "source_url": item.get("source_url") or WasacParser.OFFICIAL_URL,
                    "external_id": item.get("external_id"),
                }

                response = await self.api_client.create_outage(
                    outage=payload,
                    location_id=unique_locations[0]["id"],
                    utility_id=water["id"],
                    token=None,
                    location_ids=[location["id"] for location in unique_locations],
                )

                if response.get("status") == "duplicate":
                    duplicates += 1
                elif response.get("status") == "created":
                    created += 1
            except Exception as exc:
                failures += 1
                logger.exception(
                    "Failed to ingest WASAC announcement: %s", exc)

        return {
            "reg_outages": len(reg_outages),
            "wasac_announcements": len(water_announcements),
            "wasac_ingestable": wasac_ingestable,
            "created": created,
            "duplicates": duplicates,
            "unresolved": unresolved,
            "failed": failures,
        }


async def run_collector() -> dict[str, Any]:
    collector = UnifiedCollector()
    return await collector.run()
