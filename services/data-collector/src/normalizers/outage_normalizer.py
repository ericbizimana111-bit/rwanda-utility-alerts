import hashlib

from src.models import OutageData


class OutageNormalizer:

    @staticmethod
    def generate_external_id(
        source_name: str,
        source_url: str,
    ) -> str:
        value = f"{source_name}:{source_url}"

        return hashlib.sha256(
            value.encode("utf-8")
        ).hexdigest()

    @staticmethod
    def normalize_text(value: str) -> str:
        return " ".join(
            value.split()
        )

    @staticmethod
    def create_external_id(
        source_name: str,
        source_url: str,
    ) -> str:
        return OutageNormalizer.generate_external_id(
            source_name,
            source_url,
        )
