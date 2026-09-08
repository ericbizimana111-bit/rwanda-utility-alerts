import re
from datetime import datetime


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

        match = re.search(
            r"(\d{1,2})"
            r"(?:st|nd|rd|th)?"
            r"\s+"
            r"([A-Za-z]+)",
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

        return day, month

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
        year: int,
    ) -> datetime:

        day, month = (
            DateTimeParser.parse_date(
                date_text
            )
        )

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
                    f"{day} {month} {year} {time_text}",
                    f"%d %m %Y {time_format}",
                )
            except ValueError:
                continue

        raise ValueError(
            f"Unable to parse datetime: "
            f"{date_text} {time_text}"
        )
