"""Doctor photos stored in the database instead of as files in the frontend.

Adds the doctor_photos table and doctors.photo_version, and removes doctors.photo_filename.
Existing photos are loaded afterwards with `python -m scripts.import_doctor_photos`.

Revision ID: a3c1f0d2b7e4
Revises: 59ee31eb117b
Create Date: 2026-10-24
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a3c1f0d2b7e4"
down_revision: str | Sequence[str] | None = "59ee31eb117b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "doctor_photos",
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("content_type", sa.String(length=40), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("doctor_id"),
    )
    op.add_column("doctors", sa.Column("photo_version", sa.String(length=16), nullable=True))
    op.drop_constraint("ck_doctors_photo_filename", "doctors", type_="check")
    op.drop_column("doctors", "photo_filename")


def downgrade() -> None:
    op.add_column("doctors", sa.Column("photo_filename", sa.String(length=120), nullable=True))
    op.create_check_constraint(
        "ck_doctors_photo_filename",
        "doctors",
        "photo_filename IS NULL OR photo_filename ~ '^[a-z0-9-]+\\.(webp|jpg|jpeg|png)$'",
    )
    op.drop_column("doctors", "photo_version")
    op.drop_table("doctor_photos")
