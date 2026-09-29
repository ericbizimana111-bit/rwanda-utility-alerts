"""Rwanda's provinces and districts (2006 territorial reform: 5 provinces, 30 districts)."""

import re

PROVINCES = [
    "City of Kigali",
    "Eastern Province",
    "Northern Province",
    "Southern Province",
    "Western Province",
]

DISTRICTS = {
    "City of Kigali": ["Gasabo", "Kicukiro", "Nyarugenge"],
    "Eastern Province": [
        "Bugesera",
        "Gatsibo",
        "Kayonza",
        "Kirehe",
        "Ngoma",
        "Nyagatare",
        "Rwamagana",
    ],
    "Northern Province": [
        "Burera",
        "Gakenke",
        "Gicumbi",
        "Musanze",
        "Rulindo",
    ],
    "Southern Province": [
        "Gisagara",
        "Huye",
        "Kamonyi",
        "Muhanga",
        "Nyamagabe",
        "Nyanza",
        "Nyaruguru",
        "Ruhango",
    ],
    "Western Province": [
        "Karongi",
        "Ngororero",
        "Nyabihu",
        "Nyamasheke",
        "Rubavu",
        "Rusizi",
        "Rutsiro",
    ],
}

KIGALI_DISTRICTS = DISTRICTS["City of Kigali"]

# Lower-case district name -> canonical district name.
DISTRICT_ALIASES = {
    district.lower(): district
    for districts in DISTRICTS.values()
    for district in districts
}

# Names that refer to the whole City of Kigali rather than a single district.
KIGALI_CITY_NAMES = {"kigali", "kigali city", "city of kigali", "umujyi wa kigali"}


def expand_district(value: str) -> list[str]:
    """Canonical district names for a district mention.

    "City of Kigali" / "Kigali" expand to its three districts; unknown names
    are returned unchanged so callers can log them as unresolved.
    """
    key = re.sub(r"\s+", " ", (value or "").strip().lower())
    key = re.sub(r"\s+districts?$", "", key)
    if not key:
        return []
    if key in KIGALI_CITY_NAMES:
        return list(KIGALI_DISTRICTS)
    return [DISTRICT_ALIASES.get(key, value.strip())]
