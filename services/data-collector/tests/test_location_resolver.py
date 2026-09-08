import pytest

from src.location_resolver import LocationResolver


@pytest.mark.asyncio
async def test_normalizes_common_district_variants():
    resolver = LocationResolver()
    assert resolver.canonical_district("Nyarugenge ") == "Nyarugenge"
    assert resolver.canonical_district("Kigali") == "Kigali City"
    assert resolver.canonical_district("Rwamagana") == "Rwamagana"


@pytest.mark.asyncio
async def test_matches_district_fallback_without_area():
    resolver = LocationResolver()
    assert resolver.normalize_text("  Gasabo  ") == "gasabo"
    assert resolver.normalize_text("Kigali City") == "kigali city"
