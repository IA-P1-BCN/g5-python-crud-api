from datetime import datetime

from pydantic import BaseModel, model_validator


class TimeSlotBase(BaseModel):
    starts_at: datetime
    ends_at: datetime
    status: str | None = "available"


class TimeSlotCreate(TimeSlotBase):
    room_id: int

    @model_validator(mode="after")
    def validate_dates(self) -> "TimeSlotCreate":
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be greater than starts_at")
        return self


class TimeSlotUpdate(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: str | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> "TimeSlotUpdate":
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be greater than starts_at")
        return self


class TimeSlotResponse(TimeSlotBase):
    id: int
    room_id: int

    class Config:
        from_attributes = True