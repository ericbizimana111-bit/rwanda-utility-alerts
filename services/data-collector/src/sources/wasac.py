from src.client import SourceClient
from src.config import settings


class WasacSource:
    """
    Client for collecting water interruption information
    from the official WASAC website.
    """

    def __init__(self):
        self.client = SourceClient(
            base_url=settings.WASAC_BASE_URL,
            timeout=settings.REQUEST_TIMEOUT,
        )

    async def fetch_homepage(self) -> str:
        return await self.client.get("/")

    async def fetch_announcements(self) -> str:
        return await self.client.get(
            "/en/public-information/announcements"
        )
