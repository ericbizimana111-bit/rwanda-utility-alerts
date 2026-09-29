import pytest

from src.location_resolver import LocationResolver
from src.rwanda_locations import expand_district

LOCATIONS = {
    "Gasabo": [
        {"id": "gasabo", "district": "Gasabo", "sector": None, "cell": None, "village": None},
        {"id": "gisozi", "district": "Gasabo", "sector": "Gisozi", "cell": None, "village": None},
        {"id": "kinyinya", "district": "Gasabo", "sector": "Kinyinya", "cell": None, "village": None},
    ],
    "Kicukiro": [
        {"id": "kicukiro", "district": "Kicukiro", "sector": None, "cell": None, "village": None},
        {"id": "niboye", "district": "Kicukiro", "sector": "Niboye", "cell": None, "village": None},
    ],
    "Nyarugenge": [
        {"id": "nyarugenge", "district": "Nyarugenge", "sector": None, "cell": None, "village": None},
        {"id": "nyamirambo", "district": "Nyarugenge", "sector": "Nyamirambo", "cell": None, "village": None},
    ],
    "Rwamagana": [
        {"id": "rwamagana", "district": "Rwamagana", "sector": None, "cell": None, "village": None},
        {"id": "nyakaliro", "district": "Rwamagana", "sector": "Nyakaliro", "cell": None, "village": None},
    ],
}


@pytest.fixture
def resolver(monkeypatch):
    resolver = LocationResolver()

    async def district_locations(district):
        return LOCATIONS.get(district, [])

    monkeypatch.setattr(resolver, "_get_district_locations", district_locations)
    return resolver


def ids(locations):
    return [location["id"] for location in locations]


def test_normalizes_common_district_variants():
    assert LocationResolver.canonical_district("Nyarugenge ") == "Nyarugenge"
    assert LocationResolver.canonical_district("rwamagana district") == "Rwamagana"
    assert expand_district("Kigali") == ["Gasabo", "Kicukiro", "Nyarugenge"]
    assert expand_district("City of Kigali") == ["Gasabo", "Kicukiro", "Nyarugenge"]


def test_splits_ampersand_and_conjunctions():
    assert LocationResolver.split_areas("Gisozi & Kinyinya") == ["Gisozi", "Kinyinya"]
    assert LocationResolver.split_areas("Remera and Kimironko sectors") == ["Remera", "Kimironko"]


@pytest.mark.asyncio
async def test_matches_sectors_joined_with_ampersand(resolver):
    assert ids(await resolver.find_locations("Gasabo", "Gisozi & Kinyinya")) == ["gisozi", "kinyinya"]


@pytest.mark.asyncio
async def test_tolerates_kinyarwanda_r_l_spelling(resolver):
    # REG writes "Nyakariro"; the official sector name is "Nyakaliro".
    assert ids(await resolver.find_locations("Rwamagana", "Nyakariro")) == ["nyakaliro"]


@pytest.mark.asyncio
async def test_unknown_neighbourhood_falls_back_to_district(resolver):
    assert ids(await resolver.find_locations("Gasabo", "Gisozi, Kagugu")) == ["gisozi", "gasabo"]


@pytest.mark.asyncio
async def test_district_without_areas_uses_district_level(resolver):
    assert ids(await resolver.find_locations("Gasabo", "")) == ["gasabo"]
    assert ids(await resolver.find_locations("Gasabo", "Gasabo")) == ["gasabo"]


@pytest.mark.asyncio
async def test_city_of_kigali_only_includes_districts_with_named_sectors(resolver):
    assert ids(await resolver.find_locations("City of Kigali", "Gisozi, Nyamirambo")) == ["gisozi", "nyamirambo"]


@pytest.mark.asyncio
async def test_city_wide_announcement_covers_all_kigali_districts(resolver):
    assert ids(await resolver.find_locations("City of Kigali", "")) == ["gasabo", "kicukiro", "nyarugenge"]
