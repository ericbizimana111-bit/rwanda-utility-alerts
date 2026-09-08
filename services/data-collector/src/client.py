import asyncio
from typing import Optional

import httpx

from src.logger import get_logger


logger = get_logger("source-client")


class SourceClient:

    def __init__(
        self,
        base_url: str,
        timeout: int = 30,
        retries: int = 3,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.retries = retries

    def build_url(
        self,
        path: str,
    ) -> str:

        if path.startswith("http"):
            return path

        return (
            f"{self.base_url}/"
            f"{path.lstrip('/')}"
        )

    async def get(
        self,
        path: str,
        params: Optional[dict] = None,
    ) -> str:

        url = self.build_url(path)

        last_error = None

        for attempt in range(
            1,
            self.retries + 1,
        ):

            try:

                async with httpx.AsyncClient(
                    timeout=self.timeout,
                    follow_redirects=True,
                ) as client:

                    response = await client.get(
                        url,
                        params=params,
                    )

                    response.raise_for_status()

                    return response.text

            except Exception as error:

                last_error = error

                logger.warning(
                    f"GET failed "
                    f"(attempt {attempt}/"
                    f"{self.retries}): "
                    f"{url} | {error}"
                )

                if attempt < self.retries:
                    await asyncio.sleep(
                        attempt * 2
                    )

        raise RuntimeError(
            f"Failed to fetch {url} "
            f"after {self.retries} attempts"
        ) from last_error
