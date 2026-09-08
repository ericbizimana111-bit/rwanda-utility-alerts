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
        outage: OutageData | dict,
        location_id: str,
        utility_id: str,
        token: Optional[str] = None,
        location_ids: Optional[list[str]] = None,
    ) -> dict:

        url = f"{self.base_url}/outages/internal/collector"

        values = outage.model_dump() if isinstance(outage, OutageData) else outage

        payload = {
            "title": values["title"],
            "description": values.get("description"),
            "utilityId": utility_id,
            "locationId": location_id,
            "locationIds": location_ids or [location_id],
            "startTime": values["start_time"].isoformat() if hasattr(values["start_time"], "isoformat") else values["start_time"],
            "endTime": values["end_time"].isoformat() if hasattr(values["end_time"], "isoformat") else values["end_time"],
            "status": values["status"],
            "sourceType": values["source_type"],
            "sourceName": values["source_name"],
            "sourceUrl": values["source_url"],
            "externalId": values["external_id"],
        }

        headers = {
            "X-API-Key": settings.COLLECTOR_API_KEY,
        }

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
