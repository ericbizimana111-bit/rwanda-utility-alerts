from src.models import OutageData


class DuplicateDetector:
    def __init__(self):
        self.seen_ids: set[str] = set()

    def is_duplicate(self, outage: OutageData) -> bool:
        if outage.external_id in self.seen_ids:
            return True

        self.seen_ids.add(outage.external_id)

        return False

    def filter_duplicates(
        self,
        outages: list[OutageData],
    ) -> list[OutageData]:
        unique_outages = []

        for outage in outages:
            if self.is_duplicate(outage):
                continue

            unique_outages.append(outage)

        return unique_outages
