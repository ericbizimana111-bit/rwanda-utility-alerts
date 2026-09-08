from typing import Optional

import httpx

from src.config import settings


class LocationResolver:

    def __init__(self):
        self.base_url = (
            settings.API_BASE_URL.rstrip("/")
        )

    async def find_district(
        self,
        district: str,
    ) -> Optional[dict]:

        url = (
            f"{self.base_url}"
            f"/locations/district/"
            f"{district}"
        )

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT
        ) as client:

            response = await client.get(url)

            if response.status_code == 404:
                return None

            response.raise_for_status()

            locations = response.json()

            if not locations:
                return None

            return locations[0]

    async def find_location(
        self,
        district: str,
        area: str,
    ) -> Optional[dict]:

        locations = await self._get_district_locations(
            district
        )

        area_lower = area.lower()

        for location in locations:

            sector = (
                location.get("sector") or ""
            )

            cell = (
                location.get("cell") or ""
            )

            village = (
                location.get("village") or ""
            )

            values = [
                sector,
                cell,
                village,
            ]

            for value in values:

                if (
                    value
                    and value.lower()
                    == area_lower
                ):
                    return location

        return None

    async def _get_district_locations(
        self,
        district: str,
    ) -> list[dict]:

        url = (
            f"{self.base_url}"
            f"/locations/district/"
            f"{district}"
        )

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT
        ) as client:

            response = await client.get(url)

            if response.status_code == 404:
                return []

            response.raise_for_status()

            return response.json()
