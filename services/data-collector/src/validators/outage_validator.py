from datetime import datetime


class OutageValidator:

    REQUIRED_FIELDS = [
        "title",
        "utility_code",
        "start_time",
        "end_time",
        "source_name",
        "source_url",
        "external_id",
    ]

    @staticmethod
    def validate(
        outage: dict,
    ) -> tuple[bool, list[str]]:

        errors = []

        for field in (
            OutageValidator.REQUIRED_FIELDS
        ):
            value = outage.get(field)

            if value is None:
                errors.append(
                    f"Missing required field: {field}"
                )

        start_time = outage.get(
            "start_time"
        )

        end_time = outage.get(
            "end_time"
        )

        if (
            isinstance(start_time, datetime)
            and isinstance(end_time, datetime)
        ):
            if end_time <= start_time:
                errors.append(
                    "end_time must be after start_time"
                )

        confidence = outage.get(
            "confidence"
        )

        if confidence is not None:

            if not (
                0.0 <= confidence <= 1.0
            ):
                errors.append(
                    "confidence must be between 0 and 1"
                )

        return (
            len(errors) == 0,
            errors,
        )
