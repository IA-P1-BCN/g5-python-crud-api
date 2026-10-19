"""add catalog fields to rooms

Revision ID: 2a3b4c5d6e7f
Revises: 11f302616e11
Create Date: 2026-10-08 15:00:00.000000

"""

import re
import unicodedata
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "2a3b4c5d6e7f"
down_revision: str | None = "11f302616e11"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TEMPORARY_DEFAULTS = (
    "genre",
    "min_players",
    "difficulty",
    "hook",
    "story",
    "audience",
)


def _slugify(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    if re.search(r"[a-z]", slug):
        return slug
    return f"sala-{slug}" if slug else "sala"


def upgrade() -> None:
    op.add_column("rooms", sa.Column("slug", sa.String(length=255), nullable=True))
    op.add_column(
        "rooms",
        sa.Column(
            "genre",
            sa.String(length=100),
            nullable=False,
            server_default="Misterio",
        ),
    )
    op.add_column(
        "rooms",
        sa.Column("min_players", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "rooms",
        sa.Column("difficulty", sa.Integer(), nullable=False, server_default="3"),
    )
    op.add_column(
        "rooms",
        sa.Column("hook", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "rooms",
        sa.Column("story", sa.Text(), nullable=False, server_default=""),
    )
    op.add_column(
        "rooms",
        sa.Column(
            "audience",
            sa.String(length=100),
            nullable=False,
            server_default="Público general",
        ),
    )

    # Backfill a unique, name-based slug for every existing room.
    bind = op.get_bind()
    existing_rooms = bind.execute(sa.text("SELECT id, name FROM rooms")).fetchall()

    used_slugs: set[str] = set()
    for room_id, room_name in existing_rooms:
        base_slug = _slugify(room_name or "")
        slug = base_slug
        suffix = 2
        while slug in used_slugs:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        used_slugs.add(slug)
        bind.execute(
            sa.text("UPDATE rooms SET slug = :slug WHERE id = :id"),
            {"slug": slug, "id": room_id},
        )

    op.alter_column(
        "rooms",
        "slug",
        existing_type=sa.String(length=255),
        nullable=False,
    )

    # Business-rule constraints (BR-R7 and the 1-5 difficulty range), aligned
    # with the Room model.
    op.create_check_constraint(
        "ck_rooms_min_players_range",
        "rooms",
        "min_players >= 1 AND min_players <= capacity",
    )
    op.create_check_constraint(
        "ck_rooms_difficulty_range",
        "rooms",
        "difficulty >= 1 AND difficulty <= 5",
    )
    op.create_unique_constraint("uq_rooms_slug", "rooms", ["slug"])

    # Server defaults only existed to add NOT NULL columns to existing rows.
    for column in _TEMPORARY_DEFAULTS:
        op.alter_column("rooms", column, server_default=None)


def downgrade() -> None:
    op.drop_constraint("uq_rooms_slug", "rooms", type_="unique")
    op.drop_constraint("ck_rooms_difficulty_range", "rooms", type_="check")
    op.drop_constraint("ck_rooms_min_players_range", "rooms", type_="check")
    op.drop_column("rooms", "audience")
    op.drop_column("rooms", "story")
    op.drop_column("rooms", "hook")
    op.drop_column("rooms", "difficulty")
    op.drop_column("rooms", "min_players")
    op.drop_column("rooms", "genre")
    op.drop_column("rooms", "slug")
