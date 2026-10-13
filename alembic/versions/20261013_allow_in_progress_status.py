"""allow IN_PROGRESS booking status

Revision ID: 3b4c5d6e7f80
Revises: bf04056e1973
Create Date: 2026-10-13

"""

from collections.abc import Sequence

from alembic import op

revision: str = "3b4c5d6e7f80"
down_revision: str | Sequence[str] | None = "bf04056e1973"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint("ck_bookings_status", "bookings", type_="check")
    op.create_check_constraint(
        "ck_bookings_status",
        "bookings",
        "status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'CANCELLED')",
    )


def downgrade() -> None:
    # Games in progress go back to CONFIRMED so the old constraint accepts them.
    op.execute("UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'IN_PROGRESS'")
    op.drop_constraint("ck_bookings_status", "bookings", type_="check")
    op.create_check_constraint(
        "ck_bookings_status",
        "bookings",
        "status IN ('PENDING', 'CONFIRMED', 'CANCELLED')",
    )
