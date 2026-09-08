from typing import Optional

import httpx

from src.config import settings


class UtilityResolver:
    def __init__(self):
        self.base_url = settings.API_BASE_URL.rstrip("/")

    async def find_by_code(
        self,
        code: str,
    ) -> Optional[dict]:

        url = (
            f"{self.base_url}/utilities/"
            f"code/{code}"
        )

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT
        ) as client:

            response = await client.get(url)

            if response.status_code == 404:
                return None

            response.raise_for_status()

            return response.json()
