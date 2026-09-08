from datetime import date, datetime

import pytest

from src.location_resolver import LocationResolver
from src.models import OutageData
from src.parsers.wasac_parser import WasacParser
from src.storage.duplicate_detector import DuplicateDetector


WASAC_HTML = """
<div class="flex flex-col gap-4">
  <a class="announcement" data-category="Alerts" href="/en/public-information/announcements/d/planned-water-interruption">
    <h3>Planned water service interruption in Gasabo and Kicukiro on 12th September, 2026</h3>
    <p>08/09/2026</p>
    <p><strong>Category:</strong> Alerts</p>
    <p>Affected areas: Remera and Kimironko in Gasabo; Niboye and Kanombe in Kicukiro. Maintenance on the distribution network.</p>
  </a>
  <a class="announcement" data-category="Billing &amp; Charges" href="/billing">
    <h3>Launch of New Water Billing System</h3>
    <p>08/09/2026</p>
    <p><strong>Category:</strong> Billing &amp; Charges</p>
    <p>WASAC Group is launching a new online water billing system.</p>
  </a>
</div>
"""


HISTORICAL_HTML = """
<a class="announcement" data-category="Service Update" href="/en/public-information/announcements/d/planned-watershortage">
  <h3>Planned Water shortage in the City of Kigali on Sunday, 26th October, 2025</h3>
  <p>21/10/2025</p>
  <p><strong>Category:</strong> Service Update</p>
  <p>Planned Water shortage in the City of Kigali due to replacement of old water pipeline.</p>
</a>
"""


def test_wasac_parser_keeps_genuine_interruption_and_excludes_billing():
    items = WasacParser.parse(WASAC_HTML, reference_date=date(2026, 9, 8))

    assert len(items) == 1
    item = items[0]
    assert item["utility_code"] == "WATER"
    assert item["source_name"] == "WASAC Group"
    assert item["districts"] == ["Gasabo", "Kicukiro"]
    assert item["areas_by_district"] == {
        "Gasabo": "Remera and Kimironko",
        "Kicukiro": "Niboye and Kanombe",
    }
    assert item["start_time"] == datetime(2026, 9, 12)
    assert item["end_time"] is None
    assert item["status"] == "planned"
    assert len(item["external_id"]) == 64


def test_wasac_parser_preserves_historical_interruption_without_inventing_end_time():
    items = WasacParser.parse(HISTORICAL_HTML, reference_date=date(2026, 9, 8))

    assert len(items) == 1
    assert items[0]["status"] == "completed"
    assert items[0]["start_time"] == datetime(2025, 10, 26)
    assert items[0]["end_time"] is None
    assert items[0]["districts"] == ["Kigali City"]


def test_wasac_external_id_is_deterministic():
    first = WasacParser.parse(WASAC_HTML, reference_date=date(2026, 9, 8))[0]
    second = WasacParser.parse(WASAC_HTML, reference_date=date(2026, 9, 8))[0]

    assert first["external_id"] == second["external_id"]


@pytest.mark.asyncio
async def test_unresolved_wasac_area_does_not_fallback(monkeypatch):
    resolver = LocationResolver()

    async def district_locations(_district):
        return [{"id": "known", "sector": "Remera", "cell": None, "village": None}]

    monkeypatch.setattr(
        resolver, "_get_district_locations", district_locations)

    assert await resolver.find_locations("Gasabo", "NotARealSector") == []


def test_duplicate_detector_is_idempotent_for_same_external_id():
    outage = OutageData(
        title="Water interruption",
        utility_code="WATER",
        province="Kigali City",
        district="Gasabo",
        start_time=datetime(2026, 9, 12),
        source_name="WASAC Group",
        source_url="https://www.wasac.rw/en/public-information/announcements/d/planned-water-interruption",
        external_id="same-wasac-id",
    )
    detector = DuplicateDetector()

    assert detector.is_duplicate(outage) is False
    assert detector.is_duplicate(outage) is True
