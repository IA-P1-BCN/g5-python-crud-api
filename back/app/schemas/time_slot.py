from datetime import date, datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from back.app.core.limits import MAX_INT
from back.app.schemas.room import RoomResponse


class SlotState(StrEnum):
    """Computed state of a slot exposed to clients (ticket 059)."""

    FREE = "free"
    TAKEN = "taken"
    BLOCKED = "blocked"
    PAST = "past"


class TimeSlotBase(BaseModel):
    room_id: int = Field(ge=1, le=MAX_INT)
    starts_at: datetime
    ends_at: datetime
    status: Literal["available", "blocked"] | None = "available"

    model_config = ConfigDict(from_attributes=True)


class TimeSlotCreate(TimeSlotBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class TimeSlotUpdate(BaseModel):
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: Literal["available", "blocked"] | None = None

    model_config = ConfigDict(from_attributes=True, extra="forbid")

    @model_validator(mode="after")
    def reject_explicit_null(self):
        nulls = [name for name in self.model_fields_set if getattr(self, name) is None]
        if nulls:
            raise ValueError(f"{', '.join(sorted(nulls))} cannot be null")
        return self


class TimeSlotResponse(TimeSlotBase):
    id: int
    state: SlotState

    model_config = ConfigDict(from_attributes=True)


class TimeSlotRead(TimeSlotResponse):
    is_bookable: bool


class RoomBoardEntry(BaseModel):
    """One room column of the public day board."""

    model_config = ConfigDict(from_attributes=True)

    room: RoomResponse
    slots: list[TimeSlotResponse]


class PublicRoomBoardResponse(BaseModel):
    """Public board for a single day: active rooms with their slots."""

    date: date
    rooms: list[RoomBoardEntry]
