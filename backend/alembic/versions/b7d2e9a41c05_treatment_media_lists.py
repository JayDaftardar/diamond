"""Treatments can have several YouTube videos and several presentations.

Replaces treatments.youtube_video_id, presentation_url and presentation_provider with two
JSON lists; an existing video or presentation becomes the first item of its list.

Revision ID: b7d2e9a41c05
Revises: a3c1f0d2b7e4
Create Date: 2026-10-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "b7d2e9a41c05"
down_revision: str | Sequence[str] | None = "a3c1f0d2b7e4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    for name in ("youtube_video_ids", "presentation_urls"):
        op.add_column(
            "treatments",
            sa.Column(name, postgresql.JSONB(), server_default="[]", nullable=False),
        )
    op.execute(
        "UPDATE treatments SET youtube_video_ids = jsonb_build_array(youtube_video_id) "
        "WHERE youtube_video_id IS NOT NULL"
    )
    op.execute(
        "UPDATE treatments SET presentation_urls = jsonb_build_array(presentation_url) "
        "WHERE presentation_url IS NOT NULL"
    )
    op.drop_constraint("ck_treatments_youtube_id", "treatments", type_="check")
    op.drop_column("treatments", "youtube_video_id")
    op.drop_column("treatments", "presentation_url")
    op.drop_column("treatments", "presentation_provider")


def downgrade() -> None:
    # Only the first video and presentation survive a downgrade.
    op.add_column("treatments", sa.Column("youtube_video_id", sa.String(length=11), nullable=True))
    op.add_column("treatments", sa.Column("presentation_url", sa.Text(), nullable=True))
    op.add_column(
        "treatments", sa.Column("presentation_provider", sa.String(length=40), nullable=True)
    )
    op.execute(
        "UPDATE treatments SET youtube_video_id = youtube_video_ids ->> 0, "
        "presentation_url = presentation_urls ->> 0"
    )
    op.create_check_constraint(
        "ck_treatments_youtube_id",
        "treatments",
        "youtube_video_id IS NULL OR youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'",
    )
    op.drop_column("treatments", "presentation_urls")
    op.drop_column("treatments", "youtube_video_ids")
