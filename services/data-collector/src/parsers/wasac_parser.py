from bs4 import BeautifulSoup


class WasacParser:

    WATER_KEYWORDS = [
        "water",
        "water shortage",
        "water service interruption",
        "service interruption",
        "interruption",
        "planned water",
        "rationing",
        "supply interruption",
        "low water",
    ]

    EXCLUDE_KEYWORDS = [
        "billing",
        "bill",
        "invoice",
        "awareness",
        "policy",
        "regulation",
        "general",
        "public notice",
        "training",
    ]

    @staticmethod
    def parse(html: str) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        results: list[dict] = []

        candidates = []
        for element in soup.select("a, h2, h3, h4, li, article, p"):
            text = element.get_text(" ", strip=True)
            if not text:
                continue

            lower = text.lower()
            if any(keyword in lower for keyword in WasacParser.EXCLUDE_KEYWORDS):
                continue

            if not any(keyword in lower for keyword in WasacParser.WATER_KEYWORDS):
                continue

            candidates.append({
                "text": text,
                "href": element.get("href") if element.name == "a" else None,
            })

        seen: set[str] = set()
        for item in candidates:
            text = item["text"]
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)

            link = item["href"]
            results.append({
                "source": "WASAC",
                "utility_code": "WATER",
                "title": text,
                "summary": text,
                "source_url": link,
            })

        return results
