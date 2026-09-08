import hashlib
import re
from datetime import date, datetime
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from src.rwanda_locations import DISTRICTS


class WasacParser:
    SOURCE_NAME = "WASAC Group"
    OFFICIAL_URL = "https://www.wasac.rw/en/public-information/announcements"
    VALID_CATEGORIES = {"service update", "alerts"}
    INTERRUPTION_KEYWORDS = (
        "water shortage",
        "watershortage",
        "water interruption",
        "service interruption",
        "water supply interruption",
        "water rationing",
        "rationing plan",
        "water disruption",
        "water supply disruption",
    )
    EXCLUDE_KEYWORDS = (
        "billing",
        "bill",
        "invoice",
        "tariff",
        "charge",
        "awareness",
        "job",
        "recruit",
        "tender",
        "procurement",
        "sanitation project",
        "water connection",
        "pay your water",
    )
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
        return " ".join((value or "").split())

    @classmethod
    def parse_date(cls, text: str) -> datetime | None:
        match = re.search(
            r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})\b",
            text,
            flags=re.IGNORECASE,
        )
        if not match:
            return None

        month = cls.MONTHS.get(match.group(2).lower())
        if not month:
            return None

        return datetime(int(match.group(3)), month, int(match.group(1)))

    @classmethod
    def extract_districts(cls, text: str) -> list[str]:
        lower = text.lower()
        if "city of kigali" in lower:
            return ["Kigali City"]

        districts = [
            district
            for district_names in DISTRICTS.values()
            for district in district_names
            if re.search(rf"\b{re.escape(district.lower())}\b", lower)
        ]
        return list(dict.fromkeys(districts))

    @staticmethod
    def extract_areas(text: str) -> dict[str, str]:
        areas: dict[str, str] = {}
        for segment in re.split(r"\s*;\s*", text):
            match = re.search(
                r"(?P<areas>[A-Za-z][A-Za-z0-9 ,/&'’-]+?)\s+in\s+(?P<district>[A-Za-z]+)",
                segment,
                flags=re.IGNORECASE,
            )
            if match:
                areas[match.group("district").strip()] = match.group(
                    "areas").strip(" ,")
        return areas

    @classmethod
    def is_genuine_interruption(cls, title: str, description: str, category: str) -> bool:
        if category.lower() not in cls.VALID_CATEGORIES:
            return False

        text = f"{title} {description}".lower()
        if any(keyword in text for keyword in cls.EXCLUDE_KEYWORDS):
            return False

        return any(keyword in text for keyword in cls.INTERRUPTION_KEYWORDS)

    @classmethod
    def parse(cls, html: str, reference_date: date | None = None) -> list[dict]:
        soup = BeautifulSoup(html, "html.parser")
        today = reference_date or date.today()
        results: list[dict] = []

        for card in soup.select("a.announcement[data-category]"):
            title_node = card.select_one("h3")
            if not title_node:
                continue

            title = cls.clean_text(title_node.get_text(" ", strip=True))
            paragraphs = [
                cls.clean_text(node.get_text(" ", strip=True))
                for node in card.select("p")
            ]
            category = cls.clean_text(card.get("data-category") or "")
            summary = next(
                (
                    value
                    for value in paragraphs
                    if not re.fullmatch(r"\d{2}/\d{2}/\d{4}", value)
                    and not value.lower().startswith("category:")
                ),
                "",
            )

            if not cls.is_genuine_interruption(title, summary, category):
                continue

            event_date = cls.parse_date(title)
            status = "planned"
            if event_date and event_date.date() < today:
                status = "completed"

            href = card.get("href") or cls.OFFICIAL_URL
            source_url = urljoin(cls.OFFICIAL_URL, href)
            text = f"{title} {summary}"
            districts = cls.extract_districts(text)
            areas_by_district = cls.extract_areas(text)
            external_id = hashlib.sha256(
                f"{cls.SOURCE_NAME}|{source_url}|{title}".encode("utf-8")
            ).hexdigest()

            results.append({
                "source": cls.SOURCE_NAME,
                "utility_code": "WATER",
                "title": title,
                "summary": summary or title,
                "description": summary or title,
                "category": category,
                "districts": districts,
                "areas_by_district": areas_by_district,
                "district": districts[0] if len(districts) == 1 else None,
                "sector": areas_by_district.get(districts[0]) if len(districts) == 1 else None,
                "start_time": event_date,
                "end_time": None,
                "status": status,
                "source_name": cls.SOURCE_NAME,
                "source_url": source_url,
                "external_id": external_id,
            })

        return results
