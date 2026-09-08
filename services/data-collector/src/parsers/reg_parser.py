import re

from bs4 import BeautifulSoup


class RegParser:

    MONTHS = {
        "january": 1,
        "february": 2,
        "march": 3,
        "april": 4,
        "may": 5,
        "june": 6,
        "july": 7,
        "august": 8,
        "september": 9,
        "october": 10,
        "november": 11,
        "december": 12,
    }

    @staticmethod
    def clean_text(value: str) -> str:
        return " ".join(value.split())

    @staticmethod
    def parse(html: str) -> list[dict]:
        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        outages = []

        for row in soup.find_all("tr"):
            cells = row.find_all(
                ["td", "th"]
            )

            values = [
                RegParser.clean_text(
                    cell.get_text(" ", strip=True)
                )
                for cell in cells
            ]

            if len(values) < 6:
                continue

            if values[0].lower() == "date":
                continue

            outage = {
                "date": values[0],
                "time": values[1],
                "districts": values[2],
                "areas": values[3],
                "reason": values[4],
                "status": values[5],
            }

            if outage["status"].lower() == "planned":
                outages.append(outage)

        return outages
