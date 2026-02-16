from __future__ import annotations

from flask import Blueprint, abort, jsonify, request

from ..services.admin_store import (
    VALID_STATUSES,
    create_article,
    get_article,
    query_articles,
    update_article,
)

admin_bp = Blueprint("admin", __name__)

MAX_LIMIT = 100


@admin_bp.get("/admin/articles")
def list_articles():
    brand = request.args.get("brand")
    status = request.args.get("status")

    if status and status not in VALID_STATUSES:
        abort(400, description=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")

    try:
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))
    except ValueError:
        abort(400, description="limit and offset must be integers")

    if limit < 0 or offset < 0:
        abort(400, description="limit and offset must not be negative")
    limit = min(limit, MAX_LIMIT)

    articles, total = query_articles(brand=brand, status=status, limit=limit, offset=offset)
    has_more = offset + limit < total

    result = {
        "total": total,
        "count": len(articles),
        "limit": limit,
        "offset": offset,
        "has_more": has_more,
        "articles": articles,
    }
    if has_more:
        result["next_offset"] = offset + limit
    return jsonify(result)


@admin_bp.post("/admin/articles")
def create():
    data = request.get_json(silent=True) or {}

    brand = (data.get("brand") or "").strip()
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()

    if not brand or not title:
        abort(400, description="brand and title are required")

    status = (data.get("status") or "draft").strip()
    if status not in VALID_STATUSES:
        abort(400, description=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")

    author = (data.get("author") or "").strip()

    article = create_article(brand=brand, title=title, body=body, author=author, status=status)
    return jsonify(article), 201


@admin_bp.patch("/admin/articles/<article_id>")
def patch(article_id: str):
    existing = get_article(article_id)
    if existing is None:
        abort(404, description="Article not found")

    data = request.get_json(silent=True) or {}
    updates = {}

    if "title" in data:
        updates["title"] = (data["title"] or "").strip()
    if "body" in data:
        updates["body"] = (data["body"] or "").strip()
    if "scheduled_at" in data:
        updates["scheduled_at"] = data["scheduled_at"]
    if "status" in data:
        status = (data["status"] or "").strip()
        if status not in VALID_STATUSES:
            abort(400, description=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")
        updates["status"] = status

    article = update_article(article_id, updates)
    return jsonify(article)
