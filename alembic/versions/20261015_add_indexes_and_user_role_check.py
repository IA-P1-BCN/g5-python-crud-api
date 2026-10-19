"""add indexes and users role check

Revision ID: 5d6e7f8091a2
Revises: 0bcfcbd7da99
Create Date: 2026-10-15 16:00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "5d6e7f8091a2"
down_revision: str | Sequence[str] | None = "0bcfcbd7da99"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_time_slot_id", "bookings", ["time_slot_id"])
    op.create_index("ix_time_slots_room_starts", "time_slots", ["room_id", "starts_at"])
    op.create_check_constraint(
        "ck_users_role", "users", "role IN ('client','staff','admin')"
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_index("ix_time_slots_room_starts", "time_slots")
    op.drop_index("ix_bookings_time_slot_id", "bookings")
    op.drop_index("ix_bookings_user_id", "bookings")
