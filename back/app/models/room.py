import re
import unicodedata
from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.app.core.datetimes import as_utc
from back.app.database import Base

if TYPE_CHECKING:
    from back.app.models.time_slot import TimeSlot


def generate_slug(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    if re.search(r"[a-z]", slug):
        return slug
    return f"sala-{slug}" if slug else "sala"


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    capacity: Mapped[int] = mapped_column(nullable=False)
    duration: Mapped[int] = mapped_column(nullable=False)
    base_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="active",
        server_default=text("'active'"),
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    genre: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Misterio",
    )
    min_players: Mapped[int] = mapped_column(
        nullable=False,
        default=1,
    )
    difficulty: Mapped[int] = mapped_column(
        nullable=False,
        default=3,
    )
    hook: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    story: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )
    audience: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Público general",
    )

    __table_args__ = (
        UniqueConstraint("slug", name="uq_rooms_slug"),
        CheckConstraint("capacity >= 1", name="ck_rooms_capacity_positive"),
        CheckConstraint("duration > 0", name="ck_rooms_duration_positive"),
        CheckConstraint("base_price >= 0", name="ck_rooms_base_price_non_negative"),
        CheckConstraint(
            "status IN ('active', 'inactive')",
            name="ck_rooms_status",
        ),
        CheckConstraint(
            "min_players >= 1 AND min_players <= capacity",
            name="ck_rooms_min_players_range",
        ),
        CheckConstraint(
            "difficulty >= 1 AND difficulty <= 5",
            name="ck_rooms_difficulty_range",
        ),
    )

    time_slots: Mapped[list["TimeSlot"]] = relationship(
        back_populates="room",
    )

    @property
    def is_active(self) -> bool:
        return self.status == "active"

    @property
    def has_upcoming_slots(self) -> bool:
        now = datetime.now(UTC)
        return any(
            slot.status == "available" and as_utc(slot.starts_at) > now
            for slot in self.time_slots
        )
