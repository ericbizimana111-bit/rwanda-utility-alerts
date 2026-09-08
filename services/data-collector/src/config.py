import os

from dotenv import load_dotenv


load_dotenv()


class Settings:
    API_BASE_URL = os.getenv(
        "API_BASE_URL",
        "http://localhost:3000",
    )

    REG_BASE_URL = os.getenv(
        "REG_BASE_URL",
        "https://www.reg.rw",
    )

    WASAC_BASE_URL = os.getenv(
        "WASAC_BASE_URL",
        "https://www.wasac.rw",
    )

    REQUEST_TIMEOUT = int(
        os.getenv("REQUEST_TIMEOUT", "30")
    )


settings = Settings()
