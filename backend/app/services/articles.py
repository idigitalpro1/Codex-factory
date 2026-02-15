from datetime import UTC, datetime


def get_sample_feed() -> list[dict]:
    now = datetime.now(UTC).isoformat()
    return [
        {
            "id": "ec-001",
            "brand": "empire-courier.com",
            "title": "Empire Courier Next-Gen Pipeline Is Live",
            "slug": "empire-courier-next-gen-pipeline",
            "published_at": now,
            "tags": ["operations", "delivery", "automation"],
        },
        {
            "id": "vmg-001",
            "brand": "VillagerMediaGroup.com",
            "title": "Villager Media Group Beta Content Stack",
            "slug": "villager-media-group-beta-content-stack",
            "published_at": now,
            "tags": ["media", "cms", "beta"],
        },
    ]
