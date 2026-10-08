from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TimeSlotBase(BaseModel):
    room_id: int
    starts_at: datetime
    ends_at: datetime


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: str | None = None


class TimeSlotRead(TimeSlotBase):
    id: int
    status: str
    is_bookable: bool

    model_config = ConfigDict(from_attributes=True)