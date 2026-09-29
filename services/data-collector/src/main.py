"""Collector entrypoint.

    python -m src.main              # single run
    python -m src.main --every 30   # run every 30 minutes until stopped
"""

import argparse
import asyncio

from src.collector import run_collector
from src.logger import get_logger

logger = get_logger("collector-main")


async def run_once() -> dict:
    summary = await run_collector()
    logger.info(
        "Collector run finished: %s",
        ", ".join(f"{key}={value}" for key, value in summary.items()),
    )
    return summary


async def main(every_minutes: int | None) -> None:
    if not every_minutes:
        await run_once()
        return

    while True:
        try:
            await run_once()
        except Exception:  # keep the schedule alive through transient failures
            logger.exception("Collector run failed")
        await asyncio.sleep(every_minutes * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect REG and WASAC outage announcements.")
    parser.add_argument("--every", type=int, default=None, metavar="MINUTES",
                        help="repeat the collection every N minutes")
    args = parser.parse_args()
    asyncio.run(main(args.every))
