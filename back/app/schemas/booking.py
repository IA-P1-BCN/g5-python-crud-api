import re
from datetime import datetime
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    model_validator,
)


class BookingCreate(BaseModel):
    """Data the client sends to create a booking."""

    user_id: int
    time_slot_id: int
    players: int = Field(ge=1)


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
    capacity: int
    base_price: Decimal

    @computed_field
    @property
    def slug(self) -> str:
        """No slug column yet: derived from the name ('Faro 1923' -> 'faro-1923')."""
        return re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-")


class UserInfo(BaseModel):
    """User info shown inside a booking detail."""

    model_config = ConfigDict(from_attributes=True)

    name: str


class BookingDetail(BookingRead):
    """Booking with slot, room, user and can_modify (GET /bookings and /{id})."""

    time_slot: SlotInfo
    room: RoomInfo
    user: UserInfo
    result: dict | None = None  # game_results arrives with ticket 044
    can_modify: bool


class BookingUpdate(BaseModel):
    """Data the client sends to modify a booking (BR-B7, BR-L5)."""

    players: int | None = Field(default=None, ge=1)
    time_slot_id: int | None = None

    @model_validator(mode="after")
    def at_least_one_field(self):
        if self.players is None and self.time_slot_id is None:
            raise ValueError("Provide players, time_slot_id or both")
        return self
