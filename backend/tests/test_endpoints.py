from app import create_app


def _client():
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


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


# --- Mock AI ---

def test_mock_ai_endpoint():
    res = _client().post("/api/v1/ai/mock", json={"prompt": "daily editorial planning"})
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["provider"] == "mock-ai"
