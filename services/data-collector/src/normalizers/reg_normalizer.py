import logging
import re

from src.models import OutageData
from src.normalizers.outage_normalizer import OutageNormalizer
from src.parsers.datetime_parser import DateTimeParser

logger = logging.getLogger("reg-normalizer")


class RegNormalizer:

    SOURCE_NAME = "Rwanda Energy Group"

    UTILITY_CODE = "ELECTRICITY"

    DISTRICT_PROVINCES = {
        "Gasabo": "Kigali City",
        "Kicukiro": "Kigali City",
        "Nyarugenge": "Kigali City",

        "Bugesera": "Eastern Province",
        "Gatsibo": "Eastern Province",
        "Kayonza": "Eastern Province",
        "Kirehe": "Eastern Province",
        "Ngoma": "Eastern Province",
        "Nyagatare": "Eastern Province",
        "Rwamagana": "Eastern Province",

        "Burera": "Northern Province",
        "Gakenke": "Northern Province",
        "Gicumbi": "Northern Province",
        "Musanze": "Northern Province",
        "Rulindo": "Northern Province",

        "Gisagara": "Southern Province",
        "Huye": "Southern Province",
        "Kamonyi": "Southern Province",
        "Muhanga": "Southern Province",
        "Nyamagabe": "Southern Province",
        "Nyanza": "Southern Province",
        "Nyaruguru": "Southern Province",
        "Ruhango": "Southern Province",

        "Karongi": "Western Province",
        "Ngororero": "Western Province",
        "Nyabihu": "Western Province",
        "Nyamasheke": "Western Province",
        "Rubavu": "Western Province",
        "Rusizi": "Western Province",
        "Rutsiro": "Western Province",
    }

    @staticmethod
    def split_districts(value: str) -> list[str]:
        if not value:
            return []

        normalized = value.replace("&", ",")
        tokens = re.split(r"\s*,\s*", normalized)
        districts: list[str] = []

        for token in tokens:
            segment = re.split(r"\s*;\s*", token)
            for item in segment:
                cleaned = item.strip()
                if cleaned:
                    districts.append(cleaned)

        return districts

    @staticmethod
    def split_area_segments(value: str) -> list[str]:
        if not value:
            return []

        segments = re.split(r"\s*;\s*", value)
        cleaned = [s.strip() for s in segments if s and s.strip()]
        return cleaned

    @staticmethod
    def resolve_area_for_district(district: str, segments: list[str]) -> str:
        district_name = re.escape(district)

        for segment in segments:
            if re.search(rf"\bin\s+{district_name}\b", segment, flags=re.IGNORECASE):
                area_text = re.sub(
                    rf"\s*\bin\s+{district_name}\b",
                    "",
                    segment,
                    flags=re.IGNORECASE,
                )
                return area_text.strip(", ")

        if len(segments) == 1:
            return segments[0].strip(", ")

        raise ValueError(
            f"Could not resolve affected area segment for district: {district}")

    @classmethod
    def normalize(
        cls,
        row: dict,
        source_url: str,
        year: int,
    ) -> list[OutageData]:

        results = []

        status = (row.get("status") or "planned").strip()
        normalized_status = "planned" if status.lower(
        ) in {"planned", "current", "ongoing", "active", "scheduled"} else "planned"

        if not row.get("date") or not row.get("time"):
            raise ValueError(f"Missing date/time for REG outage row: {row}")

        start_text, end_text = (
            DateTimeParser.parse_time_range(
                row["time"]
            )
        )

        start_time = (
            DateTimeParser.build_datetime(
                row["date"],
                start_text,
                year,
            )
        )

        end_time = (
            DateTimeParser.build_datetime(
                row["date"],
                end_text,
                year,
            )
        )

        districts = cls.split_districts(row.get("districts") or "")
        area_segments = cls.split_area_segments(row.get("areas") or "")

        if not districts:
            raise ValueError(f"No districts found in REG outage row: {row}")

        district_to_areas: dict[str, str] = {}
        for district in districts:
            district_to_areas[district] = district

        for district in districts:
            try:
                district_to_areas[district] = cls.resolve_area_for_district(
                    district, area_segments)
            except ValueError:
                if len(districts) == 1:
                    district_to_areas[district] = (
                        row.get("areas") or "").strip()
                else:
                    raise

        for district in districts:

            area_detail = district_to_areas.get(
                district, row.get("areas") or "")

            province = (
                cls.DISTRICT_PROVINCES.get(
                    district,
                    "Unknown Province",
                )
            )

            external_source = (
                f"{source_url}|"
                f"{row['date']}|"
                f"{row['time']}|"
                f"{district}|"
                f"{area_detail}"
            )

            external_id = (
                OutageNormalizer
                .create_external_id(
                    cls.SOURCE_NAME,
                    external_source,
                )
            )

            outage = OutageData(
                title=(
                    "Planned electricity "
                    f"interruption in {district}"
                ),
                description=(
                    f"Reason: {row['reason']}. "
                    f"Affected areas: "
                    f"{area_detail or row.get('areas') or 'Not specified'}."
                ),
                utility_code=cls.UTILITY_CODE,
                province=province,
                district=district,
                sector=area_detail or None,
                start_time=start_time,
                end_time=end_time,
                status=normalized_status,
                source_type="official",
                source_name=cls.SOURCE_NAME,
                source_url=source_url,
                external_id=external_id,
                confidence=1.0,
            )

            logger.info(
                "REG outage normalized for district=%s, area=%s, status=%s",
                district,
                area_detail,
                normalized_status,
            )

            results.append(outage)

        return results
