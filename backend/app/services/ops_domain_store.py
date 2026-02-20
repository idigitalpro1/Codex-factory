from __future__ import annotations

from sqlalchemy import text

from app.db import db
from app.models import OpsDomain
from app.services.domain_health import check_domain

MAX_LIMIT = 100

_SEEDS = [
    {
        "domain":       "5280.menu",
        "brand_slug":   "",
        "registrar":    "GoDaddy",
        "dns_provider": "Plesk self-hosted",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://5280.menu",
        "health_url":   "https://5280.menu/api/v1/health",
        "notes":        "Codex Factory production hub",
        "tags":         '["codex","production"]',
    },
    {
        "domain":       "empire-courier.com",
        "brand_slug":   "empire-courier",
        "registrar":    "GoDaddy",
        "dns_provider": "Plesk self-hosted",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://empire-courier.com",
        "notes":        "Empire-Courier brand domain",
        "tags":         '["empire-courier"]',
    },
    {
        "domain":       "villagermediagroup.com",
        "brand_slug":   "villager",
        "registrar":    "GoDaddy",
        "dns_provider": "Plesk self-hosted",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://villagermediagroup.com",
        "notes":        "Villager Media Group brand domain",
        "tags":         '["villager"]',
    },
    {
        "domain":       "monarch.5280.menu",
        "brand_slug":   "monarch",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://monarch.5280.menu",
        "health_url":   "https://monarch.5280.menu/api/v1/health",
        "notes":        "Monarch brand subdomain (Plesk vhost pending)",
        "tags":         '["monarch","subdomain"]',
    },
    {
        "domain":       "nederland.5280.menu",
        "brand_slug":   "nederland",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://nederland.5280.menu",
        "notes":        "Nederland brand subdomain (Plesk vhost pending)",
        "tags":         '["nederland","subdomain"]',
    },
    {
        "domain":       "shop.5280.menu",
        "brand_slug":   "shop",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://shop.5280.menu",
        "notes":        "Shop brand subdomain (Plesk vhost pending)",
        "tags":         '["shop","subdomain"]',
    },
    {
        "domain":       "news.5280.menu",
        "brand_slug":   "news",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://news.5280.menu",
        "notes":        "News brand subdomain (Plesk vhost pending)",
        "tags":         '["news","subdomain"]',
    },
    {
        "domain":       "newsearchresult.5280.menu",
        "brand_slug":   "newsearchresult",
        "expected_ip":  "44.236.197.183",
        "homepage_url": "https://newsearchresult.5280.menu",
        "notes":        "New Search Result brand subdomain (Plesk vhost pending)",
        "tags":         '["newsearchresult","subdomain"]',
    },
]

_seeded = False


def _migrate_brand_slug(engine) -> None:
    """Add brand_slug column to ops_domains if it doesn't exist (SQLite-safe)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE ops_domains ADD COLUMN brand_slug VARCHAR(100)"))
            conn.commit()
    except Exception:
        pass  # Column already exists


def seed_ops_domains() -> None:
    global _seeded
    if _seeded:
        return
    _seeded = True
    _migrate_brand_slug(db.engine)
    for seed in _SEEDS:
        if not OpsDomain.query.filter_by(domain=seed["domain"]).first():
            row = OpsDomain(**{k: v for k, v in seed.items() if v is not None})
            db.session.add(row)
    db.session.commit()


def list_domains(limit: int = 20, offset: int = 0) -> tuple[list[dict], int]:
    limit = min(limit, MAX_LIMIT)
    q = OpsDomain.query.order_by(OpsDomain.created_at.asc())
    total = q.count()
    rows = q.offset(offset).limit(limit).all()
    results = []
    for row in rows:
        d = row.to_dict()
        d["health"] = check_domain(d)
        results.append(d)
    return results, total


def get_domain(domain_id: str) -> dict | None:
    row = OpsDomain.query.get(domain_id)
    return row.to_dict() if row else None


def create_domain(data: dict) -> dict:
    row = OpsDomain(
        domain       = data["domain"],
        brand_slug   = data.get("brand_slug") or "",
        registrar    = data.get("registrar"),
        dns_provider = data.get("dns_provider"),
        expected_ip  = data.get("expected_ip", "44.236.197.183"),
        homepage_url = data.get("homepage_url"),
        health_url   = data.get("health_url"),
        notes        = data.get("notes"),
        tags         = data.get("tags"),
        has_logo     = bool(data.get("has_logo", False)),
        has_favicon  = bool(data.get("has_favicon", False)),
        has_og_image = bool(data.get("has_og_image", False)),
        has_masthead = bool(data.get("has_masthead", False)),
    )
    db.session.add(row)
    db.session.commit()
    return row.to_dict()


_PATCHABLE = {
    "brand_slug", "registrar", "dns_provider", "expected_ip", "homepage_url",
    "health_url", "notes", "tags",
    "has_logo", "has_favicon", "has_og_image", "has_masthead",
}
_BOOL_FIELDS = {"has_logo", "has_favicon", "has_og_image", "has_masthead"}


def update_domain(domain_id: str, data: dict) -> dict | None:
    row = OpsDomain.query.get(domain_id)
    if row is None:
        return None
    for key, value in data.items():
        if key in _PATCHABLE:
            if key in _BOOL_FIELDS:
                value = bool(value)
            setattr(row, key, value)
    db.session.commit()
    return row.to_dict()
