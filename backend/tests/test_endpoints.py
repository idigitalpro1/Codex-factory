from app import create_app


def _client():
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def test_health_endpoint():
    res = _client().get("/api/v1/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_feed_endpoint():
    res = _client().get("/api/v1/feed/articles")
    payload = res.get_json()
    assert res.status_code == 200
    assert "articles" in payload
    assert payload["count"] == len(payload["articles"])
    assert payload["count"] >= 6


def test_feed_brand_filter():
    res = _client().get("/api/v1/feed/articles?brand=empire-courier")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["brand"] == "empire-courier"
    assert payload["count"] >= 3
    assert all(a["brand"] == "empire-courier" for a in payload["articles"])


def test_feed_brand_filter_villager():
    res = _client().get("/api/v1/feed/articles?brand=villager")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["brand"] == "villager"
    assert payload["count"] >= 3


def test_feed_unknown_brand():
    res = _client().get("/api/v1/feed/articles?brand=nonexistent")
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["count"] == 0
    assert payload["articles"] == []


def test_mock_ai_endpoint():
    res = _client().post("/api/v1/ai/mock", json={"prompt": "daily editorial planning"})
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["provider"] == "mock-ai"
