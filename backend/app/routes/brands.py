from __future__ import annotations

from flask import Blueprint, abort, jsonify

from ..services.articles import get_brand_counts
from ..services.brand_registry import get_brand, list_brands

brands_bp = Blueprint("brands", __name__)


@brands_bp.get("/brands")
def brand_list():
    brands = list_brands()
    counts = get_brand_counts()
    items = []
    for b in brands:
        entry = dict(b)
        entry["counts"] = counts.get(b["slug"], {"published": 0, "draft": 0, "scheduled": 0, "total": 0})
        items.append(entry)
    return jsonify({"items": items, "count": len(items)})


@brands_bp.get("/brands/<slug>")
def brand_detail(slug: str):
    brand = get_brand(slug)
    if brand is None or not brand.get("enabled"):
        abort(404, description="Brand not found")
    counts = get_brand_counts()
    result = dict(brand)
    result["counts"] = counts.get(slug, {"published": 0, "draft": 0, "scheduled": 0, "total": 0})
    return jsonify(result)
