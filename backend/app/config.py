# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_EXPIRE_HOURS: int = 24 * 7
    OPENAI_API_KEY: str
    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_BUCKET: str
    R2_ENDPOINT: str
    R2_PUBLIC_URL: str
    ALIYUN_SMS_KEY: str
    ALIYUN_SMS_SECRET: str
    ALIYUN_SMS_SIGN: str
    ALIYUN_SMS_TEMPLATE: str
    HUPIJIAO_KEY: str
    HUPIJIAO_SECRET: str
    MAX_DAILY_FREE_GENERATIONS: int = 1

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
