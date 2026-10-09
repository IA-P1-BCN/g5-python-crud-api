import re
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
    capacity: int = Field(..., ge=1, description="Maximum number of players")
    duration: int = Field(..., gt=0, description="Duration in minutes")
    base_price: Decimal = Field(
        ..., ge=0, decimal_places=2, description="Base price per player"
    )

    # Catalog fields (Ticket 056 / #105)
    slug: str | None = Field(
        default=None,
        description="Unique URL slug (lowercase letters, digits and hyphens). "
        "Generated from the name when omitted; immutable after creation.",
    )
    genre: str = Field(..., min_length=1, max_length=100, description="Room genre")
    min_players: int = Field(..., ge=1, description="Minimum number of players")
    difficulty: int = Field(
        ..., ge=1, le=5, description="Difficulty from 1 (easy) to 5 (hard)"
    )
    hook: str = Field(..., description="Short marketing hook")
    story: str = Field(..., description="Full room background story")
    audience: str = Field(
        ..., min_length=1, max_length=100, description="Target audience"
    )

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, value: str | None) -> str | None:
        return _validate_slug(value)


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=100)
    capacity: int | None = Field(default=None, ge=1)
    duration: int | None = Field(default=None, gt=0)
    base_price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    genre: str | None = Field(default=None, min_length=1, max_length=100)
    min_players: int | None = Field(default=None, ge=1)
    difficulty: int | None = Field(default=None, ge=1, le=5)
    hook: str | None = None
    story: str | None = None
    audience: str | None = Field(default=None, min_length=1, max_length=100)


class RoomResponse(RoomBase):
    id: int
    status: str
    slug: str

    model_config = ConfigDict(from_attributes=True)
