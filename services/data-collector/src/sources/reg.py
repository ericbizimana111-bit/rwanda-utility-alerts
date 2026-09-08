from urllib.parse import urljoin

from bs4 import BeautifulSoup

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

    async def fetch_power_outages(self, max_pages: int = 5) -> str:
        starting_url = self.client.build_url(
            "/customer-service/power-outages/")
        seen: set[str] = set()
        queue = [starting_url]
        pages: list[str] = []

        while queue and len(pages) < max_pages:
            url = queue.pop(0)
            if url in seen:
                continue

            seen.add(url)
            html = await self.client.get(url)
            pages.append(html)

            soup = BeautifulSoup(html, "html.parser")
            for link in soup.select("a[href]"):
                href = link.get("href")
                if not href or "currentPage" not in href:
                    continue

                next_url = urljoin(self.client.base_url, href)
                if next_url not in seen:
                    queue.append(next_url)

        return "\n".join(pages)

    async def fetch_announcements(self) -> str:
        return await self.client.get(
            "/media-center/announcements/"
        )
