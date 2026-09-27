#!/usr/bin/env python3
"""生成 Anthropic Research 风格封面图（qwen-image-max）

用法:
    python generate_cover.py --prompt "<完整提示词>" [--size 1664*928] [--out cover.png]
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.request

ENV_PATH = os.environ.get("BAOYU_ENV_FILE", os.path.expanduser("~/.baoyu-skills/.env"))
ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"


def load_env_key():
    with open(ENV_PATH, "r", encoding="utf-8-sig") as f:
        content = f.read()
    m = re.search(r"DASHSCOPE_API_KEY\s*=\s*\"?([^\"\r\n]+)", content)
    if not m:
        print("错误: 未找到 DASHSCOPE_API_KEY", file=sys.stderr)
        sys.exit(1)
    return m.group(1).strip()


def generate(prompt, size="1664*928", out_path="cover.png", ref=None, model="qwen-image-max"):
    key = load_env_key()
    content = []
    if ref:
        if not os.path.isfile(ref):
            print(f"错误: 参考图不存在: {ref}", file=sys.stderr)
            sys.exit(1)
        ext = os.path.splitext(ref)[1].lower().lstrip(".") or "jpeg"
        if ext == "jpg":
            ext = "jpeg"
        with open(ref, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        content.append({"image": f"data:image/{ext};base64,{b64}"})
        print(f"已附加参考图: {ref}", file=sys.stderr)
        # qwen-image-max 不支持图生图，自动切换到 qwen-image-3.0
        if model == "qwen-image-max":
            model = "qwen-image-3.0"
            print("参考图模式自动切换模型: qwen-image-3.0", file=sys.stderr)
    content.append({"text": prompt})
    body = {
        "model": model,
        "input": {
            "messages": [
                {"role": "user", "content": content}
            ]
        },
        "parameters": {
            "size": size,
            "prompt_extend": True,
            "watermark": False
        }
    }
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    output = result.get("output", {})
    img_url = None

    # 格式1: output.results[0].url
    results = output.get("results", [])
    if results and results[0].get("url"):
        img_url = results[0]["url"]

    # 格式2: output.choices[0].message.content[0].image (qwen-image-max 实际格式)
    if not img_url:
        choices = output.get("choices", [])
        if choices:
            content = choices[0].get("message", {}).get("content", [])
            if content and content[0].get("image"):
                img_url = content[0]["image"]

    if not img_url:
        print("错误: 未获取到图片结果", json.dumps(result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

    with urllib.request.urlopen(img_url, timeout=180) as resp:
        data = resp.read()
    with open(out_path, "wb") as f:
        f.write(data)
    print(f"封面已生成: {out_path} ({len(data)} bytes)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="生成 Anthropic Research 风格封面")
    parser.add_argument("--prompt", required=True, help="完整提示词")
    parser.add_argument("--size", default="1664*928", help="尺寸，如 1664*928 / 928*1664")
    parser.add_argument("--out", default="cover.png", help="输出路径")
    parser.add_argument("--ref", default=None, help="参考图路径（作为 image 输入传给模型）")
    parser.add_argument("--model", default="qwen-image-max", help="模型名，默认 qwen-image-max；传参考图时自动切 qwen-image-3.0")
    args = parser.parse_args()
    generate(args.prompt, args.size, args.out, args.ref, args.model)
