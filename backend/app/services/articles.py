from __future__ import annotations

from datetime import datetime, timezone

ARTICLES = [
    {
        "id": "ec-001",
        "brand": "empire-courier",
        "title": "Empire Courier Next-Gen Pipeline Is Live",
        "slug": "empire-courier-next-gen-pipeline",
        "summary": "The digital-first publishing pipeline for Empire-Courier is now operational.",
        "published_at": "2026-02-15",
        "tags": ["operations", "delivery", "automation"],
    },
    {
        "id": "ec-002",
        "brand": "empire-courier",
        "title": "Empire Mining Update",
        "slug": "empire-mining-update",
        "summary": "New filings in Clear Creek County signal expanded operations.",
        "published_at": "2026-02-14",
        "tags": ["mining", "clear-creek", "business"],
    },
    {
        "id": "ec-003",
        "brand": "empire-courier",
        "title": "Highway 6 Winter Closures Extended",
        "slug": "highway-6-winter-closures",
        "summary": "CDOT extends rolling closures through March due to avalanche mitigation.",
        "published_at": "2026-02-13",
        "tags": ["transportation", "cdot", "highway-6"],
    },
    {
        "id": "vmg-001",
        "brand": "villager",
        "title": "Villager Media Group Beta Content Stack",
        "slug": "villager-media-group-beta-content-stack",
        "summary": "The beta CMS and content pipeline for Villager publications is live.",
        "published_at": "2026-02-15",
        "tags": ["media", "cms", "beta"],
    },
    {
        "id": "vmg-002",
        "brand": "villager",
        "title": "Denver Zoning Shift Approved",
        "slug": "denver-zoning-shift-approved",
        "summary": "City council passes sweeping zoning reform affecting south metro communities.",
        "published_at": "2026-02-14",
        "tags": ["government", "zoning", "denver"],
    },
    {
        "id": "vmg-003",
        "brand": "villager",
        "title": "Cherry Creek Schools Bond Measure",
        "slug": "cherry-creek-schools-bond",
        "summary": "Voters to decide on $450M bond for facility upgrades this spring.",
        "published_at": "2026-02-12",
        "tags": ["education", "cherry-creek", "bond"],
    },
]


def get_articles(brand: str | None = None) -> list[dict]:
    if brand:
        return [a for a in ARTICLES if a["brand"] == brand]
    return list(ARTICLES)


def get_sample_feed() -> list[dict]:
    return get_articles()
