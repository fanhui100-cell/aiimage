"""
批量为 11 条 prompt 生成示例图，上传到 R2，写回 DB 的 example_image_url。

用法：
    cd backend
    poetry run python scripts/generate_prompt_examples.py           # 跳过已有图的
    poetry run python scripts/generate_prompt_examples.py --force   # 全部重新生成
    poetry run python scripts/generate_prompt_examples.py --slug taobao-premium-white-background
"""
import asyncio
import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import boto3
from botocore.config import Config
from app.config import settings
from app.database import SessionLocal
from app.models.prompt import Prompt
from app.services.openai_image import generate_from_text

# ── 每条 prompt 填好的示例文案（替换了 {变量} 占位符）─────────────────────────
# 对于需要参考图的 Nano Banana prompt，改成可独立生成的纯文本描述

EXAMPLE_TEXTS: dict[str, str] = {
    "taobao-premium-white-background": (
        "为一款哑光黑色蓝牙耳机生成一张淘宝/天猫风格的高质感白底商品主图。"
        "保持商品主体比例真实、轮廓清晰、材质细节可见，使用柔和棚拍光、"
        "轻微自然阴影、干净纯白背景。画面中心构图，不添加无关道具，"
        "不生成品牌 Logo，不生成夸张促销文字。"
    ),
    "pdd-promotion-main-image": (
        "为一款不锈钢真空保温杯生成拼多多爆款促销主图。"
        "商品主体要大、清晰、位于画面中心偏右，背景使用红橙高能量促销色，"
        "预留左上角价格气泡和底部卖点区域。整体风格热闹、直接、有强点击感。"
    ),
    "xiaohongshu-product-cover": (
        "为一款玫瑰香体乳护肤品生成一张小红书风格商品封面。"
        "画面要有生活方式氛围，柔和自然光，背景干净有质感，主体商品清晰可见。"
        "预留上方标题留白区域，整体像高质量种草笔记封面，色调清爽、精致。"
    ),
    "nano-banana-character-consistency": (
        "一位气质优雅的亚洲职业女性，穿着简约米色西装，在明亮干净的现代办公室拍摄写真。"
        "使用真实摄影质感、自然皮肤纹理、柔和光线和纯白背景。"
        "构图精准，面部清晰，不过度美颜，不生成夸张姿势。"
    ),
    "nano-banana-blind-box-toy": (
        "将一只可爱的柴犬转化为精致 3D 手办，保持最有辨识度的外观特征。"
        "生成透明盲盒包装、底座、标签卡和桌面陈列场景。"
        "整体风格像高端收藏玩具摄影，材质细腻，灯光柔和，画面干净。"
    ),
    "nano-banana-local-repaint": (
        "一款白色简约陶瓷马克杯，极简纯白背景，柔和环境光，产品摄影风格。"
        "主体结构清晰，透视自然，边缘干净，不引入无关元素。"
    ),
    "brand-logo-moodboard": (
        "为一家精品有机茶叶品牌创建一组高端品牌 Logo 氛围提案。"
        "包含极简标志、品牌色板（墨绿 + 米白）、字体气质、名片和包装应用场景。"
        "整体视觉应专业、克制、有高级感，适合商业品牌提案。"
    ),
    "cinematic-scene-poster": (
        "生成一张电影感场景海报，主题为赛博朋克城市霓虹雨夜。"
        "使用宽银幕构图、强叙事光影、明确前景/中景/背景层次、"
        "戏剧化冷色调和高质量摄影质感。画面有强故事张力，保留标题排版空间。"
    ),
    "social-infographic-layout": (
        "为健康饮食搭配指南生成一张现代信息图版式参考。"
        "画面包含清晰的信息分区、卡片式模块、图标占位、数据视觉化区域和标题留白。"
        "风格干净、专业、适合社媒传播。只保留版式结构，不生成可读小字。"
    ),
    "ecommerce-short-video-opening": (
        "为一款轻薄无线充电宝设计 3 秒短视频开场静帧。"
        "从极近距离的产品材质细节视角呈现，背景光线扫过主体，"
        "节奏干净、有冲击力，适合电商种草视频封面图。"
    ),
    "vlog-scene-transition": (
        "拍摄风格 Vlog 画面：手持一杯拿铁咖啡，坐在阳光明媚的咖啡馆落地窗旁，"
        "自然手持摄影感、柔和日光、真实生活氛围。画面温暖，适合种草内容。"
    ),
}

# 每条 prompt 推荐的生成尺寸
SIZES: dict[str, str] = {
    "taobao-premium-white-background": "1024x1024",
    "pdd-promotion-main-image": "1024x1024",
    "xiaohongshu-product-cover": "1024x1536",
    "nano-banana-character-consistency": "1024x1536",
    "nano-banana-blind-box-toy": "1024x1024",
    "nano-banana-local-repaint": "1024x1024",
    "brand-logo-moodboard": "1536x1024",
    "cinematic-scene-poster": "1536x1024",
    "social-infographic-layout": "1024x1536",
    "ecommerce-short-video-opening": "1024x1536",
    "vlog-scene-transition": "1024x1536",
}


def _upload_prompt_example(image_bytes: bytes, slug: str) -> str:
    """上传到 R2，路径固定为 prompts/examples/{slug}.png，返回公开 URL。"""
    s3 = boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY,
        aws_secret_access_key=settings.R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )
    key = f"prompts/examples/{slug}.png"
    s3.put_object(
        Bucket=settings.R2_BUCKET,
        Key=key,
        Body=image_bytes,
        ContentType="image/png",
    )
    return f"{settings.R2_PUBLIC_URL}/{key}"


async def generate_one(slug: str, force: bool = False) -> None:
    db = SessionLocal()
    try:
        prompt_row = db.query(Prompt).filter(Prompt.slug == slug).first()
        if prompt_row is None:
            print(f"  [跳过] {slug} 在数据库中不存在")
            return
        if prompt_row.example_image_url and not force:
            print(f"  [已有] {slug} → {prompt_row.example_image_url}")
            return

        text = EXAMPLE_TEXTS.get(slug)
        if not text:
            print(f"  [跳过] {slug} 没有配置示例文案")
            return

        size = SIZES.get(slug, "1024x1024")
        print(f"  [生成] {slug} ({size}) …")

        image_bytes, tokens = await generate_from_text(text, size=size)
        print(f"         生成完成，{tokens} tokens")

        url = _upload_prompt_example(image_bytes, slug)
        print(f"         上传完成 → {url}")

        prompt_row.example_image_url = url
        db.commit()
        print(f"         DB 已更新 ✓")

    except Exception as e:
        print(f"  [失败] {slug}: {e}")
        db.rollback()
    finally:
        db.close()


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="强制重新生成（覆盖已有图）")
    parser.add_argument("--slug", help="只生成指定 slug")
    args = parser.parse_args()

    slugs = [args.slug] if args.slug else list(EXAMPLE_TEXTS.keys())

    print(f"共 {len(slugs)} 条 prompt，force={args.force}\n")
    for slug in slugs:
        await generate_one(slug, force=args.force)
        # 每条间隔 2 秒，避免触发 OpenAI 速率限制
        if slug != slugs[-1]:
            await asyncio.sleep(2)

    print("\n全部完成！")


if __name__ == "__main__":
    asyncio.run(main())
