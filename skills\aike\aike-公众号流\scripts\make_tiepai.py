#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 贴图版生成（2026-08-20 新增）
用法: python make_tiepai.py <批次号> [--only NN] [--dry]
对 批次/批次-<批次号>/*/render.json 逐篇生成「贴图版」：
  NN-<slug>/贴图版/
  ├── article.html   正文全卡片图（封面 + 引言 + card-*.png 序列 + 结语）
  └── article.yaml   独立元数据（title=简短钩子+(图卡版) / author / digest / publish_completed: false）

标题/摘要/引言/结语数据源（优先级）：
  1) render.json 新增可选字段 "tiepai": {"title","digest","intro","outro"}
  2) 缺省回退：title = article.yaml.title 去「第 X 篇：」前缀 + 「（图卡版）」；digest 留空；
     intro/outro 用通用默认文案

⚠️ 发布兼容（重要）：publish.py 只认 <目录>/article.html + <目录>/imgs/（正则 imgs/xxx 单层，
   不认 ../）。因此本脚本把封面 + 卡片图**复制**到 贴图版/imgs/，贴图版 HTML 内用 imgs/card-01.png
   相对引用。发布时：`cp 贴图版/article.html 贴图版/article.html` 后 `publish.py full 贴图版目录`。
"""
import sys, os, re, json, shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))

CARD_PAT = re.compile(r'^card-\d{2}\.png$')

DEFAULT_INTRO = "划重点，一张图一条，照着做就行。"
DEFAULT_OUTRO = "如果这份内容对你有帮助，欢迎关注或收藏，后续继续分享实用的 AI 知识。"

TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {{ margin: 0; padding: 24px 0; background: #F7F5EF; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }}
  .wrap {{ max-width: 620px; margin: 0 auto; padding: 0 16px; }}
  img {{ display: block; width: 100%; height: auto; border-radius: 12px; margin: 0 0 20px 0; }}
  .txt {{ font-size: 17px; line-height: 1.8; color: #252525; margin: 0 0 20px 0; }}
  .lead {{ margin-top: 4px; }}
  .tail {{ margin-bottom: 8px; }}
</style>
</head>
<body>
<div class="wrap">
  <img class="lead" src="imgs/cover.png" alt="封面">
  <p class="txt">{intro}</p>
{cards}
  <p class="txt tail">{outro}</p>
</div>
</body>
</html>
"""

CARD_IMG = '  <img src="imgs/{name}" alt="卡片{i}">\n'


def find_batch_dir(batch):
    """批次定位：批次/批次-XXX 优先，回退 审核/批次-XXX（旧批次）"""
    d = os.path.join(AIKE_ROOT, "批次", f"批次-{batch}")
    if os.path.isdir(d):
        return d
    return os.path.join(AIKE_ROOT, "审核", f"批次-{batch}")


def load_yaml_simple(path):
    """极简 YAML 读取（本项目 yaml 仅顶层 key: value，含中文/引号）"""
    meta = {}
    if not os.path.isfile(path):
        return meta
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if ":" not in line or line.lstrip().startswith("#"):
                continue
            k, _, v = line.partition(":")
            k, v = k.strip(), v.strip().strip("'\"")
            if k and v:
                meta[k] = v
    return meta


def main():
    if len(sys.argv) < 2:
        print("用法: python make_tiepai.py <批次号> [--only NN] [--dry]"); sys.exit(1)
    batch = sys.argv[1]
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
    dry = "--dry" in sys.argv

    batch_dir = find_batch_dir(batch)
    if not os.path.isdir(batch_dir):
        print(f"[x] 批次目录不存在: {batch_dir}"); sys.exit(1)
    items = sorted(d for d in os.listdir(batch_dir)
                   if os.path.isdir(os.path.join(batch_dir, d)) and not d.startswith('.')
                   and re.match(r'^\d+-', d))
    if only:
        items = [d for d in items if d.startswith(only.zfill(2) + '-') or d.startswith(only)]
    if not items:
        print("[x] 没有可生成贴图版的篇目"); sys.exit(1)

    total = 0
    for it in items:
        d = os.path.join(batch_dir, it)
        rj = os.path.join(d, "render.json")
        if not os.path.exists(rj):
            print(f"[!] {it}: 无 render.json，跳过"); continue
        with open(rj, encoding="utf-8") as f:
            cfg = json.load(f)

        # 贴图版配置（可选）
        tp = cfg.get("tiepai", {}) or {}
        article_meta = load_yaml_simple(os.path.join(d, "article.yaml"))
        base_title = article_meta.get("title", "").strip()
        base_title = re.sub(r'^第\s*\d+\s*篇[：:]\s*', '', base_title)

        title = (tp.get("title") or "").strip()
        if not title:
            title = f"{base_title}（图卡版）" if base_title else "（图卡版）"
        digest = (tp.get("digest") or "").strip()
        author = (tp.get("author") or article_meta.get("author") or "").strip()
        intro = (tp.get("intro") or "").strip() or DEFAULT_INTRO
        outro = (tp.get("outro") or "").strip() or DEFAULT_OUTRO

        # 图片：封面必须存在；卡片按 imgs/ 下 card-NN.png 自然序（无 render.json cards 时兜底 glob）
        src_imgs = os.path.join(d, "imgs")
        if not os.path.isdir(src_imgs):
            print(f"[!] {it}: 无 imgs/，跳过（先跑 render_batch.py）"); continue
        if not os.path.exists(os.path.join(src_imgs, "cover.png")):
            print(f"[!] {it}: imgs/cover.png 缺失，跳过"); continue
        card_names = [f"card-{i:02d}.png" for i in range(1, len(cfg.get("cards", [])) + 1)]
        if not card_names:
            card_names = sorted(n for n in os.listdir(src_imgs) if CARD_PAT.match(n))
        card_names = [n for n in card_names if os.path.exists(os.path.join(src_imgs, n))]

        tp_dir = os.path.join(d, "贴图版")
        tp_imgs = os.path.join(tp_dir, "imgs")
        if dry:
            print(f"  [dry] {it}: title={title} | cards={card_names}")
            continue

        os.makedirs(tp_imgs, exist_ok=True)
        # 复制图（publish.py 只认本目录 imgs/，无法引用上级）
        shutil.copy(os.path.join(src_imgs, "cover.png"), os.path.join(tp_imgs, "cover.png"))
        for i, n in enumerate(card_names, 1):
            shutil.copy(os.path.join(src_imgs, n), os.path.join(tp_imgs, n))

        cards_html = "".join(CARD_IMG.format(name=n, i=i) for i, n in enumerate(card_names, 1))
        html = TEMPLATE.format(intro=intro, cards=cards_html, outro=outro)
        with open(os.path.join(tp_dir, "article.html"), "w", encoding="utf-8") as f:
            f.write(html)
        yaml_text = f"title: {title}\nauthor: {author}\n"
        if digest:
            yaml_text += f"digest: {digest}\n"
        yaml_text += "publish_completed: false\n"
        with open(os.path.join(tp_dir, "article.yaml"), "w", encoding="utf-8") as f:
            f.write(yaml_text)
        print(f"  [ok] {it}: 贴图版已生成（title={title}，图 {len(card_names)+1} 张）")
        total += 1

    print(f"\n== 贴图版生成完成：{total} 篇 ==")
    if dry:
        print("（DRY 未落盘）")
    sys.exit(0)


if __name__ == "__main__":
    main()
