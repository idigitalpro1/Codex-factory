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
]

_index = {b["slug"]: b for b in BRANDS}


def list_brands(include_disabled: bool = False) -> list[dict]:
    if include_disabled:
        return list(BRANDS)
    return [b for b in BRANDS if b["enabled"]]


def get_brand(slug: str) -> dict | None:
    return _index.get(slug)
