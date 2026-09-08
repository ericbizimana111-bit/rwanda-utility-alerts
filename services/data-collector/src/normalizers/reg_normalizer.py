from src.models import OutageData
from src.normalizers.outage_normalizer import OutageNormalizer
from src.parsers.datetime_parser import DateTimeParser


class RegNormalizer:

    SOURCE_NAME = "Rwanda Energy Group"

    UTILITY_CODE = "ELECTRICITY"

    DISTRICT_PROVINCES = {
        "Gasabo": "Kigali City",
        "Kicukiro": "Kigali City",
        "Nyarugenge": "Kigali City",

        "Bugesera": "Eastern Province",
        "Gatsibo": "Eastern Province",
        "Kayonza": "Eastern Province",
        "Kirehe": "Eastern Province",
        "Ngoma": "Eastern Province",
        "Nyagatare": "Eastern Province",
        "Rwamagana": "Eastern Province",

        "Burera": "Northern Province",
        "Gakenke": "Northern Province",
        "Gicumbi": "Northern Province",
        "Musanze": "Northern Province",
        "Rulindo": "Northern Province",

        "Gisagara": "Southern Province",
        "Huye": "Southern Province",
        "Kamonyi": "Southern Province",
        "Muhanga": "Southern Province",
        "Nyamagabe": "Southern Province",
        "Nyanza": "Southern Province",
        "Nyaruguru": "Southern Province",
        "Ruhango": "Southern Province",

        "Karongi": "Western Province",
        "Ngororero": "Western Province",
        "Nyabihu": "Western Province",
        "Nyamasheke": "Western Province",
        "Rubavu": "Western Province",
        "Rusizi": "Western Province",
        "Rutsiro": "Western Province",
    }

    @classmethod
    def normalize(
        cls,
        row: dict,
        source_url: str,
        year: int,
    ) -> list[OutageData]:

        results = []

        start_text, end_text = (
            DateTimeParser.parse_time_range(
                row["time"]
            )
        )

        start_time = (
            DateTimeParser.build_datetime(
                row["date"],
                start_text,
                year,
            )
        )

        end_time = (
            DateTimeParser.build_datetime(
                row["date"],
                end_text,
                year,
            )
        )

        districts_text = (
            row["districts"]
            .replace("&", ",")
        )

        districts = [
            value.strip()
            for value in districts_text.split(",")
            if value.strip()
        ]

        for district in districts:

            province = (
                cls.DISTRICT_PROVINCES.get(
                    district,
                    "Unknown Province",
                )
            )

            external_source = (
                f"{source_url}|"
                f"{row['date']}|"
                f"{row['time']}|"
                f"{district}|"
                f"{row['areas']}"
            )

            external_id = (
                OutageNormalizer
                .create_external_id(
                    cls.SOURCE_NAME,
                    external_source,
                )
            )

            outage = OutageData(
                title=(
                    "Planned electricity "
                    f"interruption in {district}"
                ),
                description=(
                    f"Reason: {row['reason']}. "
                    f"Affected areas: "
                    f"{row['areas']}."
                ),
                utility_code=cls.UTILITY_CODE,
                province=province,
                district=district,
                start_time=start_time,
                end_time=end_time,
                status="planned",
                source_type="official",
                source_name=cls.SOURCE_NAME,
                source_url=source_url,
                external_id=external_id,
                confidence=1.0,
            )

            results.append(outage)

        return results
