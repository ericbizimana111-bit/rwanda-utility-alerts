import re
from typing import Optional

import httpx

from src.config import settings
from src.logger import get_logger
from src.rwanda_locations import DISTRICT_ALIASES, expand_district

logger = get_logger("location-resolver")

# Words that decorate area names in announcements but are not part of them.
AREA_NOISE = re.compile(
    r"\b(?:sectors?|cells?|villages?|district|parts? of|some parts|areas?|surroundings?|and its surroundings)\b",
    re.IGNORECASE,
)


class LocationResolver:
    """Maps district + free-text area names to seeded location records."""

    def __init__(self):
        self.base_url = (
            settings.API_BASE_URL.rstrip("/")
        )
        self._district_cache: dict[str, list[dict]] = {}

    @staticmethod
    def normalize_text(value: Optional[str]) -> str:
        if not value:
            return ""
        normalized = value.strip().lower()
        normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

    @staticmethod
    def match_key(value: Optional[str]) -> str:
        """Comparison key tolerant of Kinyarwanda r/l spelling variants
        (e.g. REG writes "Nyakariro" for the official "Nyakaliro")."""
        return LocationResolver.normalize_text(value).replace("l", "r")

    @staticmethod
    def canonical_district(value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        normalized = LocationResolver.normalize_text(value)
        normalized = re.sub(r" districts?$", "", normalized)
        return DISTRICT_ALIASES.get(normalized, value.strip())

    @staticmethod
    def split_areas(areas: str) -> list[str]:
        values = []
        for value in re.split(r"[,;/&]|\band\b|\bna\b", areas or "", flags=re.IGNORECASE):
            cleaned = AREA_NOISE.sub(" ", value)
            cleaned = re.sub(r"\s+", " ", cleaned).strip(" .:-")
            if cleaned:
                values.append(cleaned)
        return values

    async def find_district(
        self,
        district: str,
    ) -> Optional[dict]:
        """The district-level location record (sector is null)."""
        district_name = self.canonical_district(district)
        if not district_name:
            return None
        locations = await self._get_district_locations(district_name)
        return next((location for location in locations if not location.get("sector")), None)

    async def find_location(
        self,
        district: str,
        area: str = "",
    ) -> Optional[dict]:
        locations = await self.find_locations(district, area)
        return locations[0] if locations else None

    async def find_locations(
        self,
        district: str,
        areas: str = "",
    ) -> list[dict]:
        """Locations affected in a district.

        Every named area that matches an official sector/cell/village is
        returned. When none of the named areas can be matched (for example
        neighbourhood names such as "Kiyovu"), the district-level location is
        returned so that district subscribers are still alerted; the exact
        wording from the source is preserved in the outage description.
        """
        district_names = expand_district(district)
        if not district_names:
            return []

        matched: list[dict] = []
        unresolved: list[str] = []
        area_values = self.split_areas(areas)

        for district_name in district_names:
            district_name = self.canonical_district(district_name)
            locations = await self._get_district_locations(district_name)
            if not locations:
                logger.warning("No locations found for district %s", district_name)
                continue

            district_matches: list[dict] = []
            for area in area_values:
                key = self.match_key(area)
                if key in {self.match_key(district_name), ""} and len(area_values) == 1:
                    continue
                candidates = [
                    location
                    for location in locations
                    if any(
                        self.match_key(location.get(field) or "") == key
                        for field in ("sector", "cell", "village")
                    )
                ]
                if not candidates:
                    unresolved.append(area)
                    continue
                # Prefer the broadest record (sector-level before cell/village).
                candidates.sort(key=lambda location: (bool(location.get("cell")), bool(location.get("village"))))
                if candidates[0] not in district_matches:
                    district_matches.append(candidates[0])

            if not district_matches:
                district_level = next((location for location in locations if not location.get("sector")), None)
                if district_level:
                    district_matches.append(district_level)

            matched.extend(location for location in district_matches if location not in matched)

        if unresolved:
            logger.info(
                "Areas without an official sector match in %s: %s",
                ", ".join(district_names),
                ", ".join(unresolved),
            )

        return matched

    async def _get_district_locations(
        self,
        district: str,
    ) -> list[dict]:

        district_name = self.canonical_district(district)
        if not district_name:
            return []
        if district_name in self._district_cache:
            return self._district_cache[district_name]

        url = (
            f"{self.base_url}"
            f"/locations/district/"
            f"{district_name}"
        )

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT
        ) as client:
            response = await client.get(url)
            if response.status_code == 404:
                return []
            response.raise_for_status()
            locations = response.json() or []

        self._district_cache[district_name] = locations
        return locations
