import re
from typing import Optional

import httpx

from src.config import settings
from src.rwanda_locations import DISTRICT_ALIASES


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
        district_name = self.canonical_district(district)
        if not district_name:
            return None

        locations = await self._get_district_locations(district_name)
        area_key = self.normalize_text(area)

        for location in locations:
            candidates = [
                location.get("sector") or "",
                location.get("cell") or "",
                location.get("village") or "",
            ]
            for candidate in candidates:
                if self.normalize_text(candidate) == area_key:
                    return location

        if locations:
            return locations[0]

        return None

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
