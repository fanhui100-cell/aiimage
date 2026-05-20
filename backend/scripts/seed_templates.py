"""Run: cd backend && poetry run python scripts/seed_templates.py"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.template import Template

TEMPLATES = [
    {
        "name": "淘宝主图 - 简约白底",
        "platform": "taobao",
        "category": "background",
        "size": "1024x1024",
        "prompt_template": "Professional product photography of {product_description} on pure white background, studio lighting, clean shadows, e-commerce style, high resolution",
    },
    {
        "name": "拼多多主图 - 低价促销风",
        "platform": "pdd",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Vibrant promotional product photo of {product_description}, bright colors, sale banner style, Chinese e-commerce, bold composition",
    },
    {
        "name": "抖音小店封面 - 竖版生活场景",
        "platform": "douyin",
        "category": "scene",
        "size": "1024x1280",
        "prompt_template": "Lifestyle product photo of {product_description}, modern Chinese home setting, natural lighting, social media ready, vertical format",
    },
    {
        "name": "通用 - 室内陈列场景",
        "platform": "universal",
        "category": "scene",
        "size": "1024x1024",
        "prompt_template": "Product {product_description} displayed in a modern minimalist indoor setting, soft natural light, lifestyle photography",
    },
    {
        "name": "通用 - 户外生活场景",
        "platform": "universal",
        "category": "scene",
        "size": "1024x1024",
        "prompt_template": "Product {product_description} in an outdoor lifestyle setting, natural sunlight, fresh and vibrant atmosphere",
    },
    {
        "name": "通用 - 简约文艺风",
        "platform": "universal",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Artistic minimalist product photo of {product_description}, neutral tones, editorial style, elegant composition",
    },
    {
        "name": "通用 - 科技感背景",
        "platform": "universal",
        "category": "background",
        "size": "1024x1024",
        "prompt_template": "Futuristic tech product display of {product_description}, dark background with blue neon accents, modern digital aesthetic",
    },
    {
        "name": "通用 - 节日促销风格",
        "platform": "universal",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Festive promotional photo of {product_description}, warm holiday colors, celebratory atmosphere, gift presentation style",
    },
    {
        "name": "通用 - 高端奢侈品风格",
        "platform": "universal",
        "category": "style",
        "size": "1024x1024",
        "prompt_template": "Luxury product photography of {product_description}, dark rich background, dramatic lighting, premium brand aesthetic",
    },
    {
        "name": "拼多多主图 - 白底通用",
        "platform": "pdd",
        "category": "background",
        "size": "1024x1024",
        "prompt_template": "Clean white background product photo of {product_description}, bright lighting, no shadows, marketplace ready",
    },
]


def seed():
    db = SessionLocal()
    try:
        count = 0
        for template in TEMPLATES:
            exists = db.query(Template).filter(Template.name == template["name"]).first()
            if not exists:
                db.add(Template(**template))
                count += 1
        db.commit()
        print(f"Seeded {count} new templates (skipped existing).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
