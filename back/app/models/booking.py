from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.app.core.errors import AppError
from back.app.database import Base

ACTIVE_STATUSES = ("PENDING", "CONFIRMED", "IN_PROGRESS")

# BR-G2: the only allowed status changes. Final states map to an empty set.
TRANSITIONS: dict[str, set[str]] = {
    "PENDING": {"CONFIRMED", "CANCELLED"},
    "CONFIRMED": {"IN_PROGRESS", "CANCELLED"},
    "IN_PROGRESS": {"COMPLETED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
}


def ensure_transition(current: str, new: str, action: str) -> None:
    """Raise 409 INVALID_TRANSITION unless current -> new is in the table."""
    if new not in TRANSITIONS[current]:
        raise AppError(
            f"Cannot {action} a {current} booking",
            code="INVALID_TRANSITION",
            status_code=409,
        )


if TYPE_CHECKING:
    from back.app.models.game_result import GameResult
    from back.app.models.time_slot import TimeSlot
    from back.app.models.user import User


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )
    time_slot_id: Mapped[int] = mapped_column(
        ForeignKey("time_slots.id"),
        nullable=False,
    )
    players: Mapped[int] = mapped_column(nullable=False)
    total_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'PENDING'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    __table_args__ = (
        CheckConstraint(
            "players >= 1",
            name="ck_bookings_players_positive",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')",
            name="ck_bookings_status",
        ),
        Index("ix_bookings_user_id", "user_id"),
        Index("ix_bookings_time_slot_id", "time_slot_id"),
        Index(
            "uq_bookings_active_time_slot",
            "time_slot_id",
            unique=True,
            postgresql_where=text("status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"),
            sqlite_where=text("status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"),
        ),
    )

    user: Mapped["User"] = relationship(
        back_populates="bookings",
    )
    time_slot: Mapped["TimeSlot"] = relationship(
        back_populates="bookings",
    )
    result: Mapped["GameResult | None"] = relationship(
        back_populates="booking",
    )
