from __future__ import annotations

import re

from ..db import db
from ..models import Article

VALID_STATUSES = {"draft", "scheduled", "published"}


def _slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug.strip("-")


def create_article(brand: str, title: str, body: str, author: str = "",
                   status: str = "draft") -> dict:
    article = Article(
        brand=brand,
        title=title,
        slug=_slugify(title),
        body=body,
        author=author,
        status=status,
    )
    db.session.add(article)
    db.session.commit()
    return article.to_dict()


def get_article(article_id: str) -> dict | None:
    article = db.session.get(Article, article_id)
    if article is None:
        return None
    return article.to_dict()


def update_article(article_id: str, updates: dict) -> dict | None:
    article = db.session.get(Article, article_id)
    if article is None:
        return None
    for key in ("title", "body", "status", "scheduled_at"):
        if key in updates:
            setattr(article, key, updates[key])
    if "title" in updates:
        article.slug = _slugify(updates["title"])
    db.session.commit()
    return article.to_dict()


def query_articles(brand: str | None = None, status: str | None = None,
                   limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    q = Article.query
    if brand:
        q = q.filter_by(brand=brand)
    if status:
        q = q.filter_by(status=status)
    total = q.count()
    articles = q.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()
    return [a.to_dict() for a in articles], total
