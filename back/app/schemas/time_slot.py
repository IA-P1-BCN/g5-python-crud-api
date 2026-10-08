from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TimeSlotRead(BaseModel):
    id: int
    room_id: int
    starts_at: datetime
    ends_at: datetime
    is_booked: bool
    is_blocked: bool
    is_bookable: bool

    model_config = ConfigDict(from_attributes=True)