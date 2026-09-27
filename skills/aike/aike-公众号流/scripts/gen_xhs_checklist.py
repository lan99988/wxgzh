#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 小红书发布清单自动生成器

本脚本根据已有文案与图片信息生成发布清单，降低人工遗漏导致流程中断的概率：
  - 标题候选 / 正文 / 标签：解析 xhs-note.md
  - 图片顺序 / 卡片说明：解析 render.json + imgs/ 实际文件
  - 输出格式：按批次文章目录中的发布清单模板生成

用法：
  python gen_xhs_checklist.py <路径> [--force]
  <路径> 可以是：
    · 待发布根目录（如 小红书/待发布）→ 遍历其下每个 NN-<slug> 篇目录
    · 单篇目录（如 小红书/待发布/01-xxx）→ 只处理该篇
  默认跳过已存在 发布清单.txt 的篇目；--force 覆盖重写。
"""
import sys, os, re, glob, json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))

TAG_RE = re.compile(r"#[\w\u4e00-\u9fff]+")
HTML_RE = re.compile(r"<[^>]+>")
def strip_html(s):
    return HTML_RE.sub("", s).replace("<br>", " ").replace("&nbsp;", " ").strip()

def parse_xhs_note(path):
    """返回 (title_candidates[list], body[str], tags[list])"""
    txt = open(path, encoding="utf-8").read()
    # 按二级标题分块（兼容「## 标题」位于文件首行、无前导换行的情况）
    secs = re.split(r"(?:\A|\n)##\s+", txt)
    titles, body, tags = [], [], []
    cur = None
    for sec in secs:
        head = sec.splitlines()[0].strip() if sec.splitlines() else ""
        if head.startswith("标题候选"):
            cur = "title"
        elif head.startswith("正文"):
            cur = "body"
        else:
            cur = "other"
        for line in sec.splitlines()[1:]:
            s = line.strip()
            if not s:
                continue
            if cur == "title":
                m = re.match(r"^\d+[\.、]\s*(.*)$", s)
                if m:
                    titles.append(m.group(1).strip())
            elif cur == "body":
                # 标题行 / 标签行结束正文
                if s.startswith("## "):
                    continue
                if TAG_RE.match(s) and not re.search(r"[。，]", s):
                    tags.append(s); continue
                body.append(s)
            else:
                # 标签常独立成段（#AI科普 #...）
                if TAG_RE.match(s) and not re.search(r"[。，]", s):
                    tags.append(s)
    # 若 body 段里混进了标签
    clean_body = []
    for b in body:
        if TAG_RE.match(b) and not re.search(r"[。，]", b):
            tags.append(b); continue
        clean_body.append(b)
    return titles, "\n".join(clean_body).strip(), tags

def card_label(card):
    f = card.get("fields", {})
    for key in ("title", "stmt", "sum"):
        if f.get(key):
            return re.sub(r"\s+", " ", strip_html(f[key]))
    return "(卡片)"

def image_order(imgs_dir, n_cards):
    """小红书发布图序：xhs-cover(3:4) → card-01..card-N"""
    files = os.listdir(imgs_dir) if os.path.isdir(imgs_dir) else []
    cover = None
    for cand in ("xhs-cover.png", "cover.png"):
        if cand in files:
            cover = cand; break
    cards = sorted(glob.glob(os.path.join(imgs_dir, "card-*.png")),
                   key=lambda p: int(re.search(r"card-(\d+)", os.path.basename(p)).group(1)))
    cards = [os.path.basename(c) for c in cards[:n_cards]] if n_cards else [os.path.basename(c) for c in cards]
    return cover, cards

def build_checklist(slug, xhs_path, render_path, imgs_dir):
    titles, body, tags = parse_xhs_note(xhs_path)
    n_cards = 0
    card_labels = []
    if render_path and os.path.exists(render_path):
        try:
            rj = json.load(open(render_path, encoding="utf-8"))
            cards = rj.get("cards", [])
            n_cards = len(cards)
            card_labels = [card_label(c) for c in cards]
        except Exception:
            pass
    cover, card_files = image_order(imgs_dir, n_cards)

    L = []
    L.append("【标题（选 1 个）】")
    for i, t in enumerate(titles, 1):
        L.append(f"{i}. {t}")
    if not titles:
        L.append("（未解析到标题候选，请从 xhs-note.md 补充）")
    L.append("")
    L.append("【正文（从 xhs-note.md 复制）】")
    L.append(body if body else "（未解析到正文）")
    L.append("")
    L.append("【标签】")
    L.append(" ".join(tags) if tags else "#AI科普")
    L.append("")
    L.append("【图片（按顺序上传）】")
    seq = 1
    if cover:
        L.append(f"{seq:02d}-{cover:<14} → 封面（小红书 3:4）")
        seq += 1
    for cf, lab in zip(card_files, card_labels):
        L.append(f"{seq:02d}-{cf:<14} → {lab}")
        seq += 1
    if not cover and not card_files:
        L.append("（未找到 imgs/ 图片，请检查渲染输出）")
    L.append("")
    L.append("【发布时间段】12:00~13:00 或 19:00~22:00")
    L.append("")
    L.append("【发布】小红书 App/网页 → 创建笔记 → 上传图片（按上面顺序）→ 粘贴正文 → 选标题 → 发布")
    return "\n".join(L) + "\n"

def is_article_dir(d):
    return os.path.isdir(d) and re.match(r"^\d{2,3}-", os.path.basename(d)) and \
           os.path.exists(os.path.join(d, "xhs-note.md"))

def main():
    if len(sys.argv) < 2:
        print("用法: python gen_xhs_checklist.py <待发布根目录|单篇目录> [--force]"); sys.exit(1)
    target = sys.argv[1]
    force = "--force" in sys.argv[2:]
    if not os.path.exists(target):
        print(f"[x] 路径不存在: {target}"); sys.exit(1)

    dirs = []
    if is_article_dir(target):
        dirs = [target]
    else:
        dirs = [os.path.join(target, d) for d in sorted(os.listdir(target)) if is_article_dir(os.path.join(target, d))]

    if not dirs:
        print("[x] 未找到含 xhs-note.md 的篇目录"); sys.exit(1)

    made, skipped, failed = 0, 0, 0
    for d in dirs:
        slug = os.path.basename(d)
        out = os.path.join(d, "发布清单.txt")
        if os.path.exists(out) and not force:
            skipped += 1
            print(f"· 跳过(已存在): {slug}")
            continue
        xhs = os.path.join(d, "xhs-note.md")
        rj = os.path.join(d, "render.json")
        imgs = os.path.join(d, "imgs")
        try:
            content = build_checklist(slug, xhs, rj, imgs)
            with open(out, "w", encoding="utf-8") as f:
                f.write(content)
            made += 1
            print(f"✓ 生成: {slug}")
        except Exception as e:
            failed += 1
            print(f"[x] 失败: {slug} -> {e}")
    print(f"\n完成: 生成 {made} | 跳过 {skipped} | 失败 {failed}")

if __name__ == "__main__":
    main()
