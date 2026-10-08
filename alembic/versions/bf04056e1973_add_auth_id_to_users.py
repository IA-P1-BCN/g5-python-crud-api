"""add auth_id to users

Revision ID: bf04056e1973
Revises: 11f302616e11
Create Date: 2026-10-08 11:14:45.738855

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "bf04056e1973"
down_revision: str | Sequence[str] | None = "11f302616e11"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("auth_id", sa.String(length=255), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_auth_id",
        "users",
        ["auth_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_users_auth_id",
        "users",
        type_="unique",
    )
    op.drop_column("users", "auth_id")
