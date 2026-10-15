from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from back.app.core.limits import MAX_INT


class BookingCreate(BaseModel):
    """Data the client sends to create a booking."""

    model_config = ConfigDict(extra="forbid")

    user_id: int = Field(ge=1, le=MAX_INT)
    time_slot_id: int = Field(ge=1, le=MAX_INT)
    players: int = Field(ge=1, le=MAX_INT)


class BookingRead(BaseModel):
    """Data the API returns for a booking."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    time_slot_id: int
    players: int
    total_price: Decimal
    status: str
    created_at: datetime


class SlotInfo(BaseModel):
    """Time slot info shown inside a booking detail."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    starts_at: datetime
    ends_at: datetime
    status: str


class RoomInfo(BaseModel):
    """Room info shown inside a booking detail."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    capacity: int
    base_price: Decimal


class UserInfo(BaseModel):
    """User info shown inside a booking detail."""

    model_config = ConfigDict(from_attributes=True)

    name: str


class GameResultInfo(BaseModel):
    """Game result of a booking (BR-G4)."""

    model_config = ConfigDict(from_attributes=True)

    completed: bool
    completion_time: int


class GameResultCreate(BaseModel):
    """Data staff sends to register a game result (BR-G4)."""

    completed: bool
    completion_time: int = Field(ge=0, le=MAX_INT)


class BookingDetail(BookingRead):
    """Booking with slot, room, user and can_modify (GET /bookings and /{id})."""

    time_slot: SlotInfo
    room: RoomInfo
    user: UserInfo
    result: GameResultInfo | None = None
    can_modify: bool


class BookingUpdate(BaseModel):
    """Data the client sends to modify a booking (BR-B7, BR-L5)."""

    players: int | None = Field(default=None, ge=1, le=MAX_INT)
    time_slot_id: int | None = Field(default=None, ge=1, le=MAX_INT)

    @model_validator(mode="after")
    def at_least_one_field(self):
        if self.players is None and self.time_slot_id is None:
            raise ValueError("Provide players, time_slot_id or both")
        return self
