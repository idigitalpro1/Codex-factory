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
    assert "items" in payload
    assert len(payload["items"]) >= 2


def test_mock_ai_endpoint():
    res = _client().post("/api/v1/ai/mock", json={"prompt": "daily editorial planning"})
    payload = res.get_json()
    assert res.status_code == 200
    assert payload["provider"] == "mock-ai"
