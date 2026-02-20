from __future__ import annotations

BRANDS = [
    {
        "slug": "empire-courier",
        "name": "Empire-Courier",
        "site_domain": "empire-courier.com",
        "tagline": "Clear Creek County's trusted voice since 1862",
        "primary_color": "#1a3a5c",
        "logo_text": "Empire-Courier",
        "enabled": True,
    },
    {
        "slug": "villager",
        "name": "Villager Media Group",
        "site_domain": "villagermediagroup.com",
        "tagline": "Connecting Colorado's south metro communities",
        "primary_color": "#6b2fa0",
        "logo_text": "Villager",
        "enabled": True,
    },
    {
        "slug": "monarch",
        "name": "Monarch",
        "site_domain": "monarch.5280.menu",
        "tagline": "Clear Creek County gaming and entertainment",
        "primary_color": "#7c3aed",
        "logo_text": "Monarch",
        "enabled": False,
    },
    {
        "slug": "nederland",
        "name": "Nederland",
        "site_domain": "nederland.5280.menu",
        "tagline": "Nederland, Colorado community news",
        "primary_color": "#059669",
        "logo_text": "Nederland",
        "enabled": False,
    },
    {
        "slug": "shop",
        "name": "Shop",
        "site_domain": "shop.5280.menu",
        "tagline": "Colorado marketplace and classifieds",
        "primary_color": "#d97706",
        "logo_text": "Shop",
        "enabled": False,
    },
    {
        "slug": "news",
        "name": "News",
        "site_domain": "news.5280.menu",
        "tagline": "Breaking news from the Colorado Rockies",
        "primary_color": "#dc2626",
        "logo_text": "News",
        "enabled": False,
    },
    {
        "slug": "newsearchresult",
        "name": "New Search Result",
        "site_domain": "newsearchresult.5280.menu",
        "tagline": "Search Colorado news and content",
        "primary_color": "#2563eb",
        "logo_text": "NSearch",
        "enabled": False,
    },
]

_index = {b["slug"]: b for b in BRANDS}


def list_brands(include_disabled: bool = False) -> list[dict]:
    if include_disabled:
        return list(BRANDS)
    return [b for b in BRANDS if b["enabled"]]


def get_brand(slug: str) -> dict | None:
    return _index.get(slug)
