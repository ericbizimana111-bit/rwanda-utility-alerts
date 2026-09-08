import asyncio

from src.ingestion import RegIngestionPipeline


async def main():
    pipeline = RegIngestionPipeline()

    await pipeline.run()


if __name__ == "__main__":
    asyncio.run(main())
