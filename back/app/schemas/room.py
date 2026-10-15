import re
from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_CAPACITY = 50
MAX_DURATION = 600

SLUG_PATTERN = re.compile(r"^(?=.*[a-z])[a-z0-9]+(?:-[a-z0-9]+)*$")


def _validate_slug(value: str | None) -> str | None:
    if value is not None and not SLUG_PATTERN.match(value):
        raise ValueError(
            "slug must contain only lowercase letters, digits and hyphens "
            "and at least one letter (e.g. 'escape-room-alpha')"
        )
    return value


class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Room name")
    capacity: int = Field(
        ..., ge=1, le=MAX_CAPACITY, description="Maximum number of players"
    )
    duration: int = Field(..., gt=0, le=MAX_DURATION, description="Duration in minutes")
    base_price: Decimal = Field(
        ..., ge=0, max_digits=10, decimal_places=2, description="Base price per player"
    )

    slug: str | None = Field(
        default=None,
        description="Unique URL slug (lowercase letters, digits and hyphens). "
        "Generated from the name when omitted; immutable after creation.",
    )
    genre: str = Field(..., min_length=1, max_length=100, description="Room genre")
    min_players: int = Field(
        ..., ge=1, le=MAX_CAPACITY, description="Minimum number of players"
    )
    difficulty: int = Field(
        ..., ge=1, le=5, description="Difficulty from 1 (easy) to 5 (hard)"
    )
    hook: str = Field(..., max_length=500, description="Short marketing hook")
    story: str = Field(..., max_length=5000, description="Full room background story")
    audience: str = Field(
        ..., min_length=1, max_length=100, description="Target audience"
    )


class RoomCreate(RoomBase):
    model_config = ConfigDict(extra="forbid")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _validate_slug(value)


class RoomUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=100)
    capacity: int | None = Field(default=None, ge=1, le=MAX_CAPACITY)
    duration: int | None = Field(default=None, gt=0, le=MAX_DURATION)
    base_price: Decimal | None = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    genre: str | None = Field(default=None, min_length=1, max_length=100)
    min_players: int | None = Field(default=None, ge=1, le=MAX_CAPACITY)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    hook: str | None = Field(default=None, max_length=500)
    story: str | None = Field(default=None, max_length=5000)
    audience: str | None = Field(default=None, min_length=1, max_length=100)


class RoomResponse(RoomBase):
    id: int
    status: str
    slug: str
    is_active: bool
    has_upcoming_slots: bool

    model_config = ConfigDict(from_attributes=True)


class TimeSlotBulkGenerateRequest(BaseModel):
    date_from: date
    date_to: date
    first_start: time
    last_start: time


class TimeSlotBulkGenerateResponse(BaseModel):
    created_count: int
    skipped_count: int
