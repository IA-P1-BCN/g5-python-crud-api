from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class TimeSlotBase(BaseModel):
    room_id: int
    starts_at: datetime
    ends_at: datetime
    status: Literal["available", "blocked"] | None = "available"

    model_config = ConfigDict(from_attributes=True)


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: Literal["available", "blocked"] | None = None

    model_config = ConfigDict(from_attributes=True)


class TimeSlotResponse(TimeSlotBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class TimeSlotRead(TimeSlotResponse):
    is_bookable: bool
