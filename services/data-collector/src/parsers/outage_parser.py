from bs4 import BeautifulSoup


class OutageParser:
    @staticmethod
    def extract_text(html: str) -> str:
        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        for element in soup(
            ["script", "style", "noscript"]
        ):
            element.decompose()

        return soup.get_text(
            separator=" ",
            strip=True,
        )

    @staticmethod
    def extract_links(html: str) -> list[dict]:
        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        links = []

        for anchor in soup.find_all("a"):
            text = anchor.get_text(
                " ",
                strip=True,
            )

            href = anchor.get("href")

            if text and href:
                links.append(
                    {
                        "text": text,
                        "url": href,
                    }
                )

        return links
