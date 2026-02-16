from flask import Blueprint, jsonify, request

from ..services.articles import get_articles

feed_bp = Blueprint("feed", __name__)


@feed_bp.get("/feed/articles")
def article_feed():
    brand = request.args.get("brand")
    articles = get_articles(brand=brand)
    result = {"count": len(articles), "articles": articles}
    if brand:
        result["brand"] = brand
    return jsonify(result)
