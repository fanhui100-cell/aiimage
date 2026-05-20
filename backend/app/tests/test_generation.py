# backend/app/tests/test_generation.py
from unittest.mock import patch, AsyncMock

def test_estimate_requires_auth(client):
    resp = client.post("/api/generate/estimate", json={"mode": "keyword", "has_reference_image": False})
    assert resp.status_code == 422  # missing Authorization header

def test_estimate_returns_credits(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"111111"
        mock_redis.delete.return_value = True
        login = client.post("/api/auth/login", json={"phone": "13900139000", "code": "111111"})
    token = login.json()["token"]

    resp = client.post(
        "/api/generate/estimate",
        json={"mode": "keyword", "has_reference_image": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["credits_required"] == 1

def test_keyword_generate_deducts_credits(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"222222"
        mock_redis.delete.return_value = True
        login = client.post("/api/auth/login", json={"phone": "13900139001", "code": "222222"})
    token = login.json()["token"]

    with patch("app.routers.generations.expand_keywords", new_callable=AsyncMock) as mock_expand, \
         patch("app.routers.generations.generate_from_text", new_callable=AsyncMock) as mock_gen, \
         patch("app.routers.generations.upload_image") as mock_upload:
        mock_expand.return_value = "blue dress spring fashion"
        mock_gen.return_value = (b"fake_png_bytes", 1000)
        mock_upload.return_value = "https://images.example.com/test.png"

        resp = client.post(
            "/api/generate/keyword",
            data={"keywords": "蓝色连衣裙"},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["credits_remaining"] == 2   # 3 - 1
    assert data["image_url"] == "https://images.example.com/test.png"

def test_generate_fails_with_insufficient_credits(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"333333"
        mock_redis.delete.return_value = True
        login = client.post("/api/auth/login", json={"phone": "13900139002", "code": "333333"})
    token = login.json()["token"]
    # Drain credits first - patch user to have 0 balance
    from app.models.user import User
    from app.tests.conftest import TestSession as _TS
    # Directly set balance to 0 for this test user
    db = _TS()
    user = db.query(User).filter(User.phone == "13900139002").first()
    if user:
        user.credit_balance = 0
        db.commit()
    db.close()

    resp = client.post(
        "/api/generate/keyword",
        data={"keywords": "test"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 402
