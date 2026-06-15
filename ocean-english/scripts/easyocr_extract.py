#!/usr/bin/env python3
# easyocr_extract.py — 本地 OCR（供 lib/document/providers/easyocr-provider.ts 调用）
# 用法: python scripts/easyocr_extract.py <image_path>
# 输出: 最后一行为 JSON {"text": "...", "confidence": 0-1 或 null}；出错为 {"error": "..."} 且退出码非 0
# 依赖: pip install easyocr   （模型默认读 ~/.EasyOCR/model，你机器上已有）
import sys
import json


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "no image path"}))
        sys.exit(1)
    path = sys.argv[1]
    try:
        import easyocr
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"error": "easyocr not installed: " + str(e)}))
        sys.exit(1)
    try:
        # 中英混排；CPU 模式（gpu=True 需 CUDA）。verbose=False 避免污染 stdout。
        reader = easyocr.Reader(["ch_sim", "en"], gpu=False, verbose=False)
        results = reader.readtext(path, detail=1, paragraph=False)
        lines = [r[1] for r in results]
        confs = [float(r[2]) for r in results if len(r) > 2]
        text = "\n".join(lines)
        conf = (sum(confs) / len(confs)) if confs else None
        print(json.dumps({"text": text, "confidence": conf}, ensure_ascii=False))
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
