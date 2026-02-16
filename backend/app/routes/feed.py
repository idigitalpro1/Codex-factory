from flask import Blueprint, abort, jsonify, request

from ..services.articles import MAX_LIMIT, query_articles

feed_bp = Blueprint("feed", __name__)


@feed_bp.get("/feed/articles")
def article_feed():
    brand = request.args.get("brand")

    try:
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))
    except ValueError:
        abort(400, description="limit and offset must be integers")

    if limit < 0 or offset < 0:
        abort(400, description="limit and offset must not be negative")
    limit = min(limit, MAX_LIMIT)

    articles, total = query_articles(brand=brand, limit=limit, offset=offset)
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
    if brand:
        result["brand"] = brand
    return jsonify(result)
