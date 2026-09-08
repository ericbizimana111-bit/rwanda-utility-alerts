import re

from bs4 import BeautifulSoup


class RegParser:

    VALID_STATUSES = {
        "planned",
        "current",
        "ongoing",
        "active",
        "scheduled",
    }

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
    def parse_status(value: str) -> str:
        cleaned = RegParser.clean_text(value or "")
        if not cleaned:
            return ""
        return cleaned

    @staticmethod
    def parse(html: str) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        outages: list[dict] = []

        tables = soup.select("table") or [soup]

        for table in tables:
            for row in table.find_all("tr"):
                cells = row.find_all(["td", "th"])
                if not cells:
                    continue

                values = [
                    RegParser.clean_text(cell.get_text(" ", strip=True))
                    for cell in cells
                ]

                if len(values) < 6:
                    continue

                if values[0].lower() == "date":
                    continue

                status = RegParser.parse_status(values[5])
                if not status:
                    continue

                status_key = status.lower()
                if status_key not in RegParser.VALID_STATUSES:
                    continue

                outage = {
                    "date": values[0],
                    "time": values[1],
                    "districts": values[2],
                    "areas": values[3],
                    "reason": values[4],
                    "status": status,
                }

                outages.append(outage)

        return outages
