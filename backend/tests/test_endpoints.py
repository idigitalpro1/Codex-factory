import os

# Force in-memory SQLite for tests
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import app.services.articles as articles_mod
from app import create_app
from app.db import db


def _client():
    application = create_app()
    application.config.update(TESTING=True)
    with application.app_context():
        db.drop_all()
        db.create_all()
        articles_mod._seeded = False
    return application.test_client()


def test_health_endpoint():
    res = _client().get("/api/v1/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


# --- Brands ---

def test_brands_endpoint():
    res = _client().get("/api/v1/brands")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["count"] == 2
    keys = [b["key"] for b in payload["items"]]
    assert "empire-courier" in keys
    assert "villager" in keys


def test_brands_have_counts():
    res = _client().get("/api/v1/brands")
    for brand in res.get_json()["items"]:
        assert "label" in brand
        assert brand["count"] >= 1


# --- Feed: basics ---

def test_feed_endpoint():
    res = _client().get("/api/v1/feed/articles")
    payload = res.get_json()
    assert res.status_code == 200
    assert "articles" in payload
    assert payload["total"] == payload["count"]
    assert payload["total"] >= 6


def test_feed_brand_filter():
    res = _client().get("/api/v1/feed/articles?brand=empire-courier")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["brand"] == "empire-courier"
    assert payload["total"] >= 3
    assert all(a["brand"] == "empire-courier" for a in payload["articles"])


def test_feed_brand_filter_villager():
    res = _client().get("/api/v1/feed/articles?brand=villager")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["brand"] == "villager"
    assert payload["total"] >= 3


def test_feed_unknown_brand():
    res = _client().get("/api/v1/feed/articles?brand=nonexistent")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["total"] == 0
    assert payload["articles"] == []


# --- Feed: pagination ---

def test_feed_pagination_limit():
    res = _client().get("/api/v1/feed/articles?limit=2")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["count"] == 2
    assert payload["limit"] == 2
    assert payload["offset"] == 0
    assert payload["has_more"] is True
    assert payload["next_offset"] == 2


def test_feed_pagination_offset():
    res = _client().get("/api/v1/feed/articles?limit=2&offset=4")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["offset"] == 4
    assert payload["count"] <= 2


def test_feed_pagination_end():
    res = _client().get("/api/v1/feed/articles?limit=100&offset=0")
    payload = res.get_json()
    assert payload["has_more"] is False
    assert "next_offset" not in payload


def test_feed_pagination_negative_offset():
    res = _client().get("/api/v1/feed/articles?offset=-1")
    assert res.status_code == 400


def test_feed_pagination_invalid_limit():
    res = _client().get("/api/v1/feed/articles?limit=abc")
    assert res.status_code == 400


def test_feed_limit_clamped():
    res = _client().get("/api/v1/feed/articles?limit=999")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["limit"] == 100


# --- Admin: CRUD ---

def test_admin_create_article():
    c = _client()
    res = c.post("/api/v1/admin/articles", json={
        "brand": "empire-courier",
        "title": "Test Draft Article",
        "body": "Some content here.",
        "author": "Ace",
    })
    payload = res.get_json()
    assert res.status_code == 201
    assert payload["brand"] == "empire-courier"
    assert payload["title"] == "Test Draft Article"
    assert payload["slug"] == "test-draft-article"
    assert payload["status"] == "draft"
    assert payload["id"]


def test_admin_create_missing_fields():
    res = _client().post("/api/v1/admin/articles", json={"brand": "x"})
    assert res.status_code == 400


def test_admin_create_invalid_status():
    res = _client().post("/api/v1/admin/articles", json={
        "brand": "x", "title": "Y", "body": "Z", "status": "bogus"
    })
    assert res.status_code == 400


def test_admin_list_articles():
    c = _client()
    c.post("/api/v1/admin/articles", json={"brand": "villager", "title": "A", "body": "B"})
    c.post("/api/v1/admin/articles", json={"brand": "empire-courier", "title": "C", "body": "D"})
    res = c.get("/api/v1/admin/articles")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["total"] >= 2


def test_admin_list_filter_brand():
    c = _client()
    c.post("/api/v1/admin/articles", json={"brand": "villager", "title": "A", "body": "B"})
    c.post("/api/v1/admin/articles", json={"brand": "empire-courier", "title": "C", "body": "D"})
    res = c.get("/api/v1/admin/articles?brand=villager")
    payload = res.get_json()
    # Includes seed villager articles + the one we created
    assert all(a["brand"] == "villager" for a in payload["articles"])


def test_admin_patch_status():
    c = _client()
    create_res = c.post("/api/v1/admin/articles", json={
        "brand": "empire-courier", "title": "Publish Me", "body": "Content"
    })
    article_id = create_res.get_json()["id"]
    res = c.patch(f"/api/v1/admin/articles/{article_id}", json={"status": "published"})
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["status"] == "published"


def test_admin_patch_invalid_status():
    c = _client()
    create_res = c.post("/api/v1/admin/articles", json={
        "brand": "villager", "title": "X", "body": "Y"
    })
    article_id = create_res.get_json()["id"]
    res = c.patch(f"/api/v1/admin/articles/{article_id}", json={"status": "bogus"})
    assert res.status_code == 400


def test_admin_patch_not_found():
    res = _client().patch("/api/v1/admin/articles/nonexistent-id", json={"title": "X"})
    assert res.status_code == 404


# --- Integration: draft -> publish -> appears in feed ---

def test_draft_to_published_appears_in_feed():
    c = _client()
    # Create a draft
    create_res = c.post("/api/v1/admin/articles", json={
        "brand": "empire-courier", "title": "Integration Test Article", "body": "Full cycle."
    })
    article_id = create_res.get_json()["id"]
    assert create_res.get_json()["status"] == "draft"

    # Should NOT appear in public feed yet
    feed_res = c.get("/api/v1/feed/articles?brand=empire-courier")
    feed_titles = [a["title"] for a in feed_res.get_json()["articles"]]
    assert "Integration Test Article" not in feed_titles

    # Publish it
    c.patch(f"/api/v1/admin/articles/{article_id}", json={"status": "published"})

    # NOW should appear in public feed
    feed_res = c.get("/api/v1/feed/articles?brand=empire-courier")
    feed_titles = [a["title"] for a in feed_res.get_json()["articles"]]
    assert "Integration Test Article" in feed_titles


# --- Mock AI ---

def test_mock_ai_endpoint():
    res = _client().post("/api/v1/ai/mock", json={"prompt": "daily editorial planning"})
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["provider"] == "mock-ai"
