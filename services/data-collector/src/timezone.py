from datetime import date, datetime, timedelta, timezone

# Rwanda uses Central Africa Time: a fixed UTC+2 offset, no daylight saving.
KIGALI_TZ = timezone(timedelta(hours=2), "CAT")


def kigali_today() -> date:
    return datetime.now(KIGALI_TZ).date()
