import re
from datetime import date, datetime, timedelta
from typing import Optional

from src.timezone import KIGALI_TZ, kigali_today


class DateTimeParser:

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
    def clean_time(value: str) -> str:
        value = value.strip()

        value = value.replace(".", ":")

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value.upper()

    @staticmethod
    def parse_date(
        date_text: str,
    ) -> tuple[int, int]:
        day, month, _year = DateTimeParser.parse_date_parts(date_text)
        return day, month

    @staticmethod
    def parse_date_parts(
        date_text: str,
    ) -> tuple[int, int, Optional[int]]:
        """Returns (day, month, year) where year is None when not written."""

        match = re.search(
            r"(\d{1,2})"
            r"(?:st|nd|rd|th)?"
            r"\s+"
            r"([A-Za-z]+)"
            r"(?:,?\s+(\d{4}))?",
            date_text,
            re.IGNORECASE,
        )

        if not match:
            raise ValueError(
                f"Unable to parse date: {date_text}"
            )

        day = int(match.group(1))

        month_name = (
            match.group(2).lower()
        )

        month = DateTimeParser.MONTHS.get(
            month_name
        )

        if not month:
            raise ValueError(
                f"Unknown month: {month_name}"
            )

        year = int(match.group(3)) if match.group(3) else None

        return day, month, year

    @staticmethod
    def infer_year(day: int, month: int, today: Optional[date] = None) -> int:
        """Picks the year that puts day/month closest to today (handles Dec/Jan rollover)."""
        today = today or kigali_today()
        candidates = []
        for year in (today.year - 1, today.year, today.year + 1):
            try:
                candidates.append(date(year, month, day))
            except ValueError:
                continue
        if not candidates:
            raise ValueError(f"Invalid date: {day}/{month}")
        return min(candidates, key=lambda value: abs((value - today).days)).year

    @staticmethod
    def parse_time_range(
        time_text: str,
    ) -> tuple[str, str]:

        time_text = (
            time_text
            .replace("–", "-")
            .replace("—", "-")
        )

        parts = re.split(
            r"\s*-\s*",
            time_text,
            maxsplit=1,
        )

        if len(parts) != 2:
            raise ValueError(
                f"Unable to parse time: {time_text}"
            )

        return (
            DateTimeParser.clean_time(parts[0]),
            DateTimeParser.clean_time(parts[1]),
        )

    @staticmethod
    def build_datetime(
        date_text: str,
        time_text: str,
        year: Optional[int] = None,
    ) -> datetime:
        """Builds a timezone-aware datetime in Kigali time (UTC+2).

        The year written in the source always wins; `year` is only a fallback
        for dates published without one, otherwise the year is inferred.
        """

        day, month, written_year = (
            DateTimeParser.parse_date_parts(
                date_text
            )
        )
        resolved_year = written_year or year or DateTimeParser.infer_year(day, month)

        time_text = (
            DateTimeParser.clean_time(
                time_text
            )
        )

        formats = [
            "%I:%M %p",
            "%I %p",
            "%H:%M",
        ]

        for time_format in formats:
            try:
                return datetime.strptime(
                    f"{day} {month} {resolved_year} {time_text}",
                    f"%d %m %Y {time_format}",
                ).replace(tzinfo=KIGALI_TZ)
            except ValueError:
                continue

        raise ValueError(
            f"Unable to parse datetime: "
            f"{date_text} {time_text}"
        )

    @staticmethod
    def build_range(
        date_text: str,
        time_range_text: str,
        year: Optional[int] = None,
    ) -> tuple[datetime, datetime]:
        start_text, end_text = DateTimeParser.parse_time_range(time_range_text)
        start = DateTimeParser.build_datetime(date_text, start_text, year)
        end = DateTimeParser.build_datetime(date_text, end_text, year)
        # Works that run past midnight (e.g. 10:00 PM - 04:00 AM) end the next day.
        if end <= start:
            end += timedelta(days=1)
        return start, end
