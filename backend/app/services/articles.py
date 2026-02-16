from __future__ import annotations

from ..db import db
from ..models import Article
from .brand_registry import get_brand

MAX_LIMIT = 100
DEFAULT_LIMIT = 20

# Seed articles inserted on first request if DB is empty
_SEEDS = [
    {"brand": "empire-courier", "title": "Empire Courier Next-Gen Pipeline Is Live",
     "slug": "empire-courier-next-gen-pipeline",
     "summary": "The digital-first publishing pipeline for Empire-Courier is now operational.",
     "published_at": "2026-02-15", "tags": ["operations", "delivery", "automation"]},
    {"brand": "empire-courier", "title": "Empire Mining Update",
     "slug": "empire-mining-update",
     "summary": "New filings in Clear Creek County signal expanded operations.",
     "published_at": "2026-02-14", "tags": ["mining", "clear-creek", "business"]},
    {"brand": "empire-courier", "title": "Highway 6 Winter Closures Extended",
     "slug": "highway-6-winter-closures",
     "summary": "CDOT extends rolling closures through March due to avalanche mitigation.",
     "published_at": "2026-02-13", "tags": ["transportation", "cdot", "highway-6"]},
    {"brand": "villager", "title": "Villager Media Group Beta Content Stack",
     "slug": "villager-media-group-beta-content-stack",
     "summary": "The beta CMS and content pipeline for Villager publications is live.",
     "published_at": "2026-02-15", "tags": ["media", "cms", "beta"]},
    {"brand": "villager", "title": "Denver Zoning Shift Approved",
     "slug": "denver-zoning-shift-approved",
     "summary": "City council passes sweeping zoning reform affecting south metro communities.",
     "published_at": "2026-02-14", "tags": ["government", "zoning", "denver"]},
    {"brand": "villager", "title": "Cherry Creek Schools Bond Measure",
     "slug": "cherry-creek-schools-bond",
     "summary": "Voters to decide on $450M bond for facility upgrades this spring.",
     "published_at": "2026-02-12", "tags": ["education", "cherry-creek", "bond"]},
]

_seeded = False


def _ensure_seeds():
    global _seeded
    if _seeded:
        return
    if Article.query.count() == 0:
        for s in _SEEDS:
            article = Article(
                brand=s["brand"],
                title=s["title"],
                slug=s["slug"],
                body=s.get("summary", ""),
                status="published",
            )
            db.session.add(article)
        db.session.commit()
    _seeded = True


def get_articles(brand: str | None = None) -> list[dict]:
    _ensure_seeds()
    q = Article.query.filter_by(status="published")
    if brand:
        q = q.filter_by(brand=brand)
    return [a.to_dict() for a in q.order_by(Article.created_at.desc()).all()]


def get_brand_counts() -> dict[str, dict[str, int]]:
    """Return {brand_slug: {published: N, draft: N, total: N}}."""
    _ensure_seeds()
    rows = (
        db.session.query(Article.brand, Article.status, db.func.count(Article.id))
        .group_by(Article.brand, Article.status)
        .all()
    )
    counts: dict[str, dict[str, int]] = {}
    for brand_slug, status, count in rows:
        if brand_slug not in counts:
            counts[brand_slug] = {"published": 0, "draft": 0, "scheduled": 0, "total": 0}
        counts[brand_slug][status] = count
        counts[brand_slug]["total"] += count
    return counts


def list_brands() -> list[dict]:
    _ensure_seeds()
    counts = get_brand_counts()
    # Legacy shape for backwards compat with feed brand buttons
    results = (
        db.session.query(Article.brand, db.func.count(Article.id))
        .filter_by(status="published")
        .group_by(Article.brand)
        .all()
    )
    brand_info = get_brand
    return [
        {
            "key": brand_slug,
            "label": (brand_info(brand_slug) or {}).get("name", brand_slug),
            "count": count,
        }
        for brand_slug, count in results
    ]


def query_articles(
    brand: str | None = None,
    limit: int = DEFAULT_LIMIT,
    offset: int = 0,
) -> tuple[list[dict], int]:
    _ensure_seeds()
    q = Article.query.filter_by(status="published")
    if brand:
        q = q.filter_by(brand=brand)
    total = q.count()
    articles = q.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()
    return [a.to_dict() for a in articles], total
