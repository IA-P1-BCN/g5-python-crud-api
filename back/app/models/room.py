import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.app.database import Base

if TYPE_CHECKING:
    from back.app.models.time_slot import TimeSlot


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
        server_default=text("'active'"),
    )

    
    slug: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        default=lambda: f"room-{uuid.uuid4().hex[:8]}",
        server_default=text("'room-default'"),
    )

    genre: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        server_default=text("'Mystery'"),
    )
    min_players: Mapped[int] = mapped_column(
        nullable=False,
        server_default=text("1"),
    )
    difficulty: Mapped[int] = mapped_column(
        nullable=False,
        server_default=text("3"),
    )
    hook: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("''"),
    )
    story: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("''"),
    )
    audience: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        server_default=text("'All ages'"),
    )

    __table_args__ = (
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