import re


class LocationParser:

    @staticmethod
    def normalize(value: str) -> str:
        value = value.strip()

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value

    @staticmethod
    def split_districts(
        districts_text: str,
    ) -> list[str]:

        text = (
            districts_text
            .replace("&", ",")
        )

        districts = [
            LocationParser.normalize(
                value
            )
            for value in text.split(",")
        ]

        return [
            district
            for district in districts
            if district
        ]

    @staticmethod
    def parse_areas(
        areas_text: str,
    ) -> list[dict]:

        results = []

        sections = re.split(
            r";",
            areas_text,
        )

        for section in sections:

            section = (
                LocationParser.normalize(
                    section
                )
            )

            match = re.match(
                r"(.+?)\s+in\s+(.+)$",
                section,
                re.IGNORECASE,
            )

            if not match:
                continue

            areas_text = match.group(1)
            district = match.group(2)

            areas = [
                LocationParser.normalize(
                    area
                )
                for area in areas_text.split(",")
            ]

            for area in areas:

                if area:
                    results.append(
                        {
                            "district": district,
                            "area": area,
                        }
                    )

        return results
