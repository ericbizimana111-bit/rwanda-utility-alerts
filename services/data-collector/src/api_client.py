import asyncio
from typing import Optional

import httpx

from src.config import settings
from src.logger import get_logger
from src.models import OutageData


logger = get_logger("api-client")


class ApiClient:

    def __init__(self):
        self.base_url = (
            settings.API_BASE_URL.rstrip("/")
        )

    async def create_outage(
        self,
        outage: OutageData,
        location_id: str,
        utility_id: str,
        token: Optional[str] = None,
    ) -> dict:

        url = f"{self.base_url}/outages"

        payload = {
            "title": outage.title,
            "description": outage.description,
            "utilityId": utility_id,
            "locationId": location_id,
            "startTime": outage.start_time.isoformat(),
            "endTime": outage.end_time.isoformat(),
            "status": outage.status,
            "sourceType": outage.source_type,
            "sourceName": outage.source_name,
            "sourceUrl": outage.source_url,
            "externalId": outage.external_id,
        }

        headers = {}

        if token:
            headers["Authorization"] = (
                f"Bearer {token}"
            )

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT
        ) as client:

            for attempt in range(1, 4):

                try:

                    response = await client.post(
                        url,
                        json=payload,
                        headers=headers,
                    )

                    if response.status_code == 409:
                        return {
                            "status": "duplicate",
                            "data": response.json(),
                        }

                    response.raise_for_status()

                    return {
                        "status": "created",
                        "data": response.json(),
                    }

                except httpx.HTTPError as error:

                    logger.warning(
                        f"API request failed "
                        f"(attempt {attempt}/3): "
                        f"{error}"
                    )

                    if attempt == 3:
                        raise

                    await asyncio.sleep(
                        attempt * 2
                    )

        raise RuntimeError(
            "Failed to create outage"
        )
