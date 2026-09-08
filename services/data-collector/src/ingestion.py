from src.api_client import ApiClient
from src.collector import RegCollector
from src.location_resolver import LocationResolver
from src.utility_resolver import UtilityResolver


class RegIngestionPipeline:
    def __init__(self):
        self.collector = RegCollector()
        self.location_resolver = LocationResolver()
        self.utility_resolver = UtilityResolver()
        self.api_client = ApiClient()

    async def run(self) -> dict:
        print("=" * 60)
        print("REG INGESTION STARTED")
        print("=" * 60)

        outages = await self.collector.collect()

        print(
            f"Collected {len(outages)} unique outages"
        )

        utility = (
            await self.utility_resolver.find_by_code(
                "ELECTRICITY"
            )
        )

        if not utility:
            raise RuntimeError(
                "ELECTRICITY utility was not found"
            )

        utility_id = utility["id"]

        created = 0
        duplicates = 0
        unresolved = 0
        failed = 0

        for outage in outages:

            print(
                f"\nProcessing: {outage.title}"
            )

            location = (
                await self.location_resolver.find_location(
                    district=outage.district,
                )
            )

            if not location:
                print(
                    "  Location unresolved:"
                    f" {outage.district}"
                )

                unresolved += 1
                continue

            try:
                result = (
                    await self.api_client.create_outage(
                        outage=outage,
                        location_id=location["id"],
                        utility_id=utility_id,
                    )
                )

                if result["status"] == "created":
                    created += 1

                    print(
                        "  CREATED"
                        f" → {location['district']}"
                    )

                elif result["status"] == "duplicate":
                    duplicates += 1

                    print("  DUPLICATE")

            except Exception as error:
                failed += 1

                print(
                    "  FAILED:"
                    f" {error}"
                )

        result = {
            "collected": len(outages),
            "created": created,
            "duplicates": duplicates,
            "unresolved": unresolved,
            "failed": failed,
        }

        print("\n" + "=" * 60)
        print("REG INGESTION FINISHED")
        print("=" * 60)

        for key, value in result.items():
            print(f"{key}: {value}")

        return result
