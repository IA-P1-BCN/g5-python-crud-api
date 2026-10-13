"""allow COMPLETED booking status

Revision ID: 4c5d6e7f8091
Revises: 3b4c5d6e7f80
Create Date: 2026-10-13

"""

from collections.abc import Sequence

from alembic import op

revision: str = "4c5d6e7f8091"
down_revision: str | Sequence[str] | None = "3b4c5d6e7f80"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("ck_bookings_status", "bookings", type_="check")
    op.create_check_constraint(
        "ck_bookings_status",
        "bookings",
        "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')",
    )


def downgrade() -> None:
    # Finished games go back to IN_PROGRESS so the old constraint accepts them.
    op.execute("UPDATE bookings SET status = 'IN_PROGRESS' WHERE status = 'COMPLETED'")
    op.drop_constraint("ck_bookings_status", "bookings", type_="check")
    op.create_check_constraint(
        "ck_bookings_status",
        "bookings",
        "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'CANCELLED')",
    )
