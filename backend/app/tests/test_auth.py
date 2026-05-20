from unittest.mock import patch

def test_send_code_returns_200(client):
    with patch("app.routers.auth.send_sms_code") as mock_sms, \
         patch("app.routers.auth.redis_client") as mock_redis:
        mock_sms.return_value = None
        mock_redis.get.return_value = None  # no rate limit hit
        mock_redis.setex.return_value = True
        resp = client.post("/api/auth/send-code", json={"phone": "13800138000"})
    assert resp.status_code == 200

def test_login_with_wrong_code_returns_400(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"123456"
        resp = client.post("/api/auth/login", json={"phone": "13800138000", "code": "000000"})
    assert resp.status_code == 400

def test_login_creates_user_and_returns_token(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"123456"
        mock_redis.delete.return_value = True
        resp = client.post("/api/auth/login", json={"phone": "13800138000", "code": "123456"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["credit_balance"] == 3  # new user gets 3 free credits
    assert data["tier"] == "free"

def test_login_second_time_does_not_duplicate_user(client):
    with patch("app.routers.auth.redis_client") as mock_redis:
        mock_redis.get.return_value = b"999999"
        mock_redis.delete.return_value = True
        resp1 = client.post("/api/auth/login", json={"phone": "13900000001", "code": "999999"})
        mock_redis.get.return_value = b"999999"
        resp2 = client.post("/api/auth/login", json={"phone": "13900000001", "code": "999999"})
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    # same user, same balance (not doubled)
    assert resp2.json()["credit_balance"] == 3
