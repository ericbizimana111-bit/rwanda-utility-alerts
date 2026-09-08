from src.client import SourceClient
from src.config import settings


class RegSource:
    def __init__(self):
        self.client = SourceClient(
            base_url=settings.REG_BASE_URL,
            timeout=settings.REQUEST_TIMEOUT,
        )

    async def fetch_homepage(self) -> str:
        return await self.client.get("/")

    async def fetch_power_outages(self) -> str:
        return await self.client.get(
            "/customer-service/power-outages/"
        )

    async def fetch_announcements(self) -> str:
        return await self.client.get(
            "/media-center/announcements/"
        )
