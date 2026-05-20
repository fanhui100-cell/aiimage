# backend/app/schemas/user.py
from pydantic import BaseModel

class SendCodeRequest(BaseModel):
    phone: str

class LoginRequest(BaseModel):
    phone: str
    code: str

class LoginResponse(BaseModel):
    token: str
    credit_balance: int
    tier: str
