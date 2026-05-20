# backend/app/services/payment.py
"""
虎皮椒支付集成。
IMPORTANT: Verify before going live:
- Business type allowed (virtual goods / AI-generated content)
- Daily/single transaction limits
- Fee rates
- Refund process
- Risk control rules
"""
import hashlib
import time
import httpx
from app.config import settings

PACKAGES: dict[str, dict] = {
    "trial":    {"name": "体验包",    "price_cny": 9.90,  "credits": 6},
    "standard": {"name": "标准包",    "price_cny": 39.00, "credits": 30},
    "pro":      {"name": "专业包",    "price_cny": 99.00, "credits": 100},
    "shop":     {"name": "店铺包",    "price_cny": 299.00,"credits": 350},
}

def get_package(package_id: str) -> dict:
    if package_id not in PACKAGES:
        raise ValueError(f"Unknown package: {package_id}")
    return {"id": package_id, **PACKAGES[package_id]}

def _sign(params: dict) -> str:
    """Hupijiao signature: sort by key, join as key=value, append secret, MD5."""
    sorted_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()) if v is not None and v != "")
    raw = sorted_str + settings.HUPIJIAO_SECRET
    return hashlib.md5(raw.encode()).hexdigest()

async def create_payment_order(order_id: str, package_id: str, notify_url: str, return_url: str) -> str:
    """Create Hupijiao order. Returns payment redirect URL."""
    pkg = get_package(package_id)
    params = {
        "appid": settings.HUPIJIAO_KEY,
        "trade_order_id": order_id,
        "total_fee": str(pkg["price_cny"]),
        "title": f"AI商品图积分 - {pkg['name']}",
        "notify_url": notify_url,
        "return_url": return_url,
        "time": str(int(time.time())),
        "nonce_str": order_id[:16],
    }
    params["hash"] = _sign(params)
    async with httpx.AsyncClient(timeout=10.0) as http:
        resp = await http.post("https://api.xunhupay.com/payment/do.html", data=params)
        resp.raise_for_status()
    data = resp.json()
    if data.get("errcode") != 0:
        raise RuntimeError(f"Payment error: {data.get('errmsg')}")
    return data["url"]

def verify_webhook(params: dict) -> bool:
    """Verify Hupijiao callback signature."""
    received_hash = params.get("hash", "")
    params_without_hash = {k: v for k, v in params.items() if k != "hash"}
    expected = _sign(params_without_hash)
    return received_hash == expected
