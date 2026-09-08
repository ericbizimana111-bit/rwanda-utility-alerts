from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OutageData(BaseModel):
    title: str

    description: Optional[str] = None

    utility_code: str

    province: str

    district: str

    sector: Optional[str] = None

    cell: Optional[str] = None

    village: Optional[str] = None

    start_time: Optional[datetime] = None

    end_time: Optional[datetime] = None

    status: str = "planned"

    source_type: str = "official"

    source_name: str

    source_url: str

    external_id: str

    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
    )
