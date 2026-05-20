# backend/app/schemas/credit.py
from pydantic import BaseModel

class PackageInfo(BaseModel):
    id: str
    name: str
    price_cny: float
    credits: int
    description: str

class CreateOrderRequest(BaseModel):
    package_id: str

class CreateOrderResponse(BaseModel):
    order_id: str
    pay_url: str
    amount_cny: float
    credits: int
