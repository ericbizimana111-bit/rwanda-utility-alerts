import re
from typing import Optional

import httpx

from src.config import settings
from src.logger import get_logger
from src.rwanda_locations import DISTRICT_ALIASES

logger = get_logger("location-resolver")


class LocationResolver:

    def __init__(self):
        self.base_url = (
            settings.API_BASE_URL.rstrip("/")
        )

    @staticmethod
    def normalize_text(value: Optional[str]) -> str:
        if not value:
            return ""
        normalized = value.strip().lower()
        normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

    @staticmethod
    def canonical_district(value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        normalized = LocationResolver.normalize_text(value)
        if normalized in DISTRICT_ALIASES:
            return DISTRICT_ALIASES[normalized]
        for alias, district in DISTRICT_ALIASES.items():
            if normalized == alias or normalized == LocationResolver.normalize_text(district):
                return district
        return value.strip()

    async def find_district(
        self,
        district: str,
    ) -> Optional[dict]:

        district_name = self.canonical_district(district)
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
                return None
            response.raise_for_status()
            locations = response.json()
            return locations[0] if locations else None

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
        district_name = self.canonical_district(district)
        if not district_name:
            return []

        locations = await self._get_district_locations(district_name)
        area_values = [
            value.strip()
            for value in re.split(r"[,;/]", areas or "")
            if value.strip()
        ]

        if not area_values:
            return []

        matched: list[dict] = []
        unresolved: list[str] = []

        for area in area_values:
            area_key = self.normalize_text(area)
            candidates = [
                location
                for location in locations
                if any(
                    self.normalize_text(location.get(field) or "") == area_key
                    for field in ("sector", "cell", "village")
                )
            ]

            if not candidates:
                unresolved.append(area)
                continue

            location = candidates[0]
            if location not in matched:
                matched.append(location)

        if unresolved:
            logger.warning(
                "Unresolved location areas for district %s: %s",
                district_name,
                ", ".join(unresolved),
            )
            return []

        return matched

    async def _get_district_locations(
        self,
        district: str,
    ) -> list[dict]:

        district_name = self.canonical_district(district)
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
            return response.json() or []
