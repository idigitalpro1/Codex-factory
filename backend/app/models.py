from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .db import db


def _utcnow():
    return datetime.now(timezone.utc)


class Article(db.Model):
    __tablename__ = "articles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand = db.Column(db.String(100), nullable=False, index=True)
    title = db.Column(db.String(500), nullable=False)
    slug = db.Column(db.String(500), nullable=False)
    body = db.Column(db.Text, nullable=False, default="")
    author = db.Column(db.String(200), nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default="draft", index=True)
    scheduled_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "brand": self.brand,
            "title": self.title,
            "slug": self.slug,
            "body": self.body,
            "author": self.author,
            "status": self.status,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
