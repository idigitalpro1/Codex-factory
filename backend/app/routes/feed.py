from flask import Blueprint, jsonify

from ..services.articles import get_sample_feed

feed_bp = Blueprint("feed", __name__)


@feed_bp.get("/feed/articles")
def article_feed():
    return jsonify({"items": get_sample_feed()})
