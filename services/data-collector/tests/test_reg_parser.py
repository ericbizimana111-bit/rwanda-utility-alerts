from src.normalizers.reg_normalizer import RegNormalizer
from src.parsers.reg_parser import RegParser


SAMPLE_HTML = """
<table>
  <tr>
    <th>Date</th>
    <th>Time</th>
    <th>District Affected</th>
    <th>Sector / Areas</th>
    <th>Reason</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>12th September 2026</td>
    <td>09:30 AM - 02:00 PM</td>
    <td>Gasabo, Kicukiro &amp; Rwamagana</td>
    <td>Rutunga, Ndera, Gikomero, Rusororo in Gasabo; Nyarugunga, Kanombe, Masaka in Kicukiro; Fumbwe, Gahengeri, Muyumbu, Nyakariro in Rwamagana</td>
    <td>Extension works on "Gasogi" substation</td>
    <td>Planned</td>
  </tr>
  <tr>
    <td>11th September 2026</td>
    <td>12:00 PM - 02:00 PM</td>
    <td>Rubavu, Muhanga &amp; Ruhango</td>
    <td>Nyundo, Nyakiriba, Rugerero, Cyanzarwe, Kanama, Kanzenze, Mudende, Busasamana in Rubavu; Nyamabuye, Rugendabari, Nyarusange, Mushishiro, Muhanga, Shyogwe in Muhanga; Byimana, Mwendo in Ruhango</td>
    <td>Maintenance and extension works on "Mukamira" feeder "Gikuyu" T-off &amp; "Muhanga" feeder</td>
    <td>Current</td>
  </tr>
  <tr>
    <td>9th September 2026</td>
    <td>08:00 AM - 10:00 AM</td>
    <td>Nyamagabe</td>
    <td>Gasaka, Kibeho in Nyamagabe</td>
    <td>Transformer maintenance</td>
    <td>Completed</td>
  </tr>
</table>
"""


def test_reg_parser_keeps_valid_planned_and_current_rows_only():
    rows = RegParser.parse(SAMPLE_HTML)

    assert len(rows) == 2
    assert [row["status"] for row in rows] == ["Planned", "Current"]
    assert rows[0]["date"] == "12th September 2026"
    assert rows[1]["time"] == "12:00 PM - 02:00 PM"


def test_reg_normalizer_splits_multiple_districts_and_areas():
    rows = RegParser.parse(SAMPLE_HTML)
    normalized = RegNormalizer.normalize(
        rows[0], "https://www.reg.rw/customer-service/power-outages/", 2026)

    assert len(normalized) == 3
    districts = {item.district for item in normalized}
    assert districts == {"Gasabo", "Kicukiro", "Rwamagana"}
    assert all(item.status == "planned" for item in normalized)
    assert all(item.source_name ==
               "Rwanda Energy Group" for item in normalized)
    assert all(item.source_url ==
               "https://www.reg.rw/customer-service/power-outages/" for item in normalized)
    assert len({item.external_id for item in normalized}) == 3


def test_reg_normalizer_preserves_time_ranges_and_dates():
    rows = RegParser.parse(SAMPLE_HTML)
    normalized = RegNormalizer.normalize(
        rows[1], "https://www.reg.rw/customer-service/power-outages/", 2026)

    assert len(normalized) == 3
    assert normalized[0].start_time.strftime(
        "%Y-%m-%d %H:%M:%S") == "2026-09-11 12:00:00"
    assert normalized[0].end_time.strftime(
        "%Y-%m-%d %H:%M:%S") == "2026-09-11 14:00:00"
    assert normalized[0].status == "planned"
