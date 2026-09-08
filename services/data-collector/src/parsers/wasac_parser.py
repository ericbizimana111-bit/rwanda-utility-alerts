from bs4 import BeautifulSoup


class WasacParser:

    WATER_KEYWORDS = [
        "water",
        "water shortage",
        "water service interruption",
        "planned water",
        "rationing",
        "interruption",
    ]

    @staticmethod
    def parse(html: str) -> list[dict]:
        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        results = []

        for link in soup.find_all("a"):
            title = link.get_text(
                " ",
                strip=True,
            )

            if not title:
                continue

            title_lower = title.lower()

            if not any(
                keyword in title_lower
                for keyword in WasacParser.WATER_KEYWORDS
            ):
                continue

            href = link.get("href")

            results.append(
                {
                    "source": "WASAC",
                    "utility_code": "WATER",
                    "title": title,
                    "url": href,
                }
            )

        return results
