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

from back.app.database import Base

if TYPE_CHECKING:
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
            "status IN ('PENDING', 'CONFIRMED', 'CANCELLED')",
            name="ck_bookings_status",
        ),
        # IN_PROGRESS is introduced in Sprint 2.
        # It is included in the partial index now to satisfy BR-B8.
        Index(
            "uq_bookings_active_time_slot",
            "time_slot_id",
            unique=True,
            postgresql_where=text(
                "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"
            ),
            sqlite_where=text(
                "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')"
            ),
        ),
    )

    user: Mapped["User"] = relationship(
        back_populates="bookings",
    )
    time_slot: Mapped["TimeSlot"] = relationship(
        back_populates="bookings",
    )