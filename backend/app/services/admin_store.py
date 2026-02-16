from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

VALID_STATUSES = {"draft", "scheduled", "published"}

_articles: list[dict] = []


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug.strip("-")


def reset_store() -> None:
    _articles.clear()


def create_article(brand: str, title: str, body: str, author: str = "",
                   status: str = "draft") -> dict:
    now = _now()
    article = {
        "id": str(uuid.uuid4()),
        "brand": brand,
        "title": title,
        "slug": _slugify(title),
        "body": body,
        "author": author,
        "status": status,
        "created_at": now,
        "updated_at": now,
        "scheduled_at": None,
    }
    _articles.append(article)
    return article


def get_article(article_id: str) -> dict | None:
    for a in _articles:
        if a["id"] == article_id:
            return a
    return None


def update_article(article_id: str, updates: dict) -> dict | None:
    article = get_article(article_id)
    if article is None:
        return None
    for key in ("title", "body", "status", "scheduled_at"):
        if key in updates:
            article[key] = updates[key]
    if "title" in updates:
        article["slug"] = _slugify(updates["title"])
    article["updated_at"] = _now()
    return article


def query_articles(brand: str | None = None, status: str | None = None,
                   limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    pool = _articles
    if brand:
        pool = [a for a in pool if a["brand"] == brand]
    if status:
        pool = [a for a in pool if a["status"] == status]
    total = len(pool)
    page = pool[offset : offset + limit]
    return page, total
