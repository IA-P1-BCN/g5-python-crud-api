from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


class TimeSlotBase(BaseModel):
    room_id: int
    starts_at: datetime
    ends_at: datetime
    status: Optional[Literal["available", "blocked"]] = "available"

    model_config = ConfigDict(from_attributes=True)


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    status: Optional[Literal["available", "blocked"]] = None

    model_config = ConfigDict(from_attributes=True)


class TimeSlotResponse(TimeSlotBase):
    id: int

    model_config = ConfigDict(from_attributes=True)