#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 批次阶段校验
用法: python check_batch.py <批次号>
读 批次/批次-<批次号>/批次编排表.md + 文件系统 → 输出每篇差异报告 + 阶段汇总
检查项: article.md / xhs-note.md / render.json / imgs/*.png / article.html / 发布清单.txt
规则（统一批次制）：统一批次制 —— 小红书内容（xhs-note.md + 发布清单.txt）并入批次篇目录
NN-<slug>\，不再放 小红书\待发布\。兼容回退：新结构篇目录内未找到时，回退查 小红书\待发布\<slug>\（旧批次）。
"""
import sys, os, re, glob

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))
XHS_DIR = os.path.join(AIKE_ROOT, "小红书", "待发布")   # 旧批次回退位置

def pil_size(png):
    try:
        from PIL import Image
        return Image.open(png).size
    except Exception:
        return None

def main():
    if len(sys.argv) < 2:
        print("用法: python check_batch.py <批次号>"); sys.exit(1)
    batch = sys.argv[1]
    batch_dir = os.path.join(AIKE_ROOT, "批次", f"批次-{batch}")
    if not os.path.isdir(batch_dir):   # 兼容回退旧目录（过渡期旧批次）
        batch_dir = os.path.join(AIKE_ROOT, "审核", f"批次-{batch}")
    if not os.path.isdir(batch_dir):
        print(f"[x] 批次目录不存在: {batch_dir}"); sys.exit(1)

    items = sorted(d for d in os.listdir(batch_dir)
                   if os.path.isdir(os.path.join(batch_dir, d)) and not d.startswith('.')
                   and re.match(r'^\d{2}-', d))  # 仅认 NN- 前缀的篇目目录
    if not items:
        print("[x] 批次内没有篇目文件夹"); sys.exit(1)

    # 编排表状态（若有）
    sheet = os.path.join(batch_dir, "批次编排表.md")
    sheet_rows = {}
    if os.path.exists(sheet):
        with open(sheet, encoding="utf-8") as f:
            for line in f:
                m = re.match(r'\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|', line)
                if m and m.group(1).isdigit():
                    sheet_rows[m.group(2).strip()] = line.strip()

    print(f"== 批次 {batch} 校验报告 ==")
    print(f"{'篇目':<32} {'稿':<4} {'xhs':<4} {'rj':<4} {'图':<4} {'html':<5} {'清单':<4} 尺寸")
    print("-" * 78)
    totals = {"稿": 0, "xhs": 0, "rj": 0, "图": 0, "html": 0, "清单": 0}
    n_items = 0
    for it in items:
        d = os.path.join(batch_dir, it)
        has_art = os.path.exists(os.path.join(d, "article.md"))
        # 统一批次制：小红书产物并入批次篇目录；旧批次回退 小红书\待发布\<slug>\
        xhs_d = os.path.join(d)
        has_xhs = os.path.exists(os.path.join(xhs_d, "xhs-note.md"))
        has_list = os.path.exists(os.path.join(xhs_d, "发布清单.txt"))
        if not has_xhs or not has_list:   # 旧批次回退
            xhs_legacy = os.path.join(XHS_DIR, it)
            if os.path.exists(os.path.join(xhs_legacy, "xhs-note.md")):
                has_xhs = True
            if os.path.exists(os.path.join(xhs_legacy, "发布清单.txt")):
                has_list = True
        has_rj = os.path.exists(os.path.join(d, "render.json"))
        pngs = glob.glob(os.path.join(d, "imgs", "*.png"))
        has_html = os.path.exists(os.path.join(d, "article.html"))
        n_items += 1
        for k, v in [("稿", has_art), ("xhs", has_xhs), ("rj", has_rj), ("图", bool(pngs)),
                     ("html", has_html), ("清单", has_list)]:
            if v: totals[k] += 1
        size_note = ""
        if pngs:
            sizes = sorted({str(pil_size(p)) for p in pngs})
            size_note = ",".join(sizes)[:40]
        flags = f"{'✓' if has_art else '·':<3} {'✓' if has_xhs else '·':<4} {'✓' if has_rj else '·':<4} {'✓' if pngs else '·':<4} {'✓' if has_html else '·':<5} {'✓' if has_list else '·':<4}"
        print(f"{it:<32} {flags} {size_note}")

    print("-" * 78)
    print(f"篇目 {n_items} | 稿 {totals['稿']}/{n_items} | xhs {totals['xhs']}/{n_items} | "
          f"render.json {totals['rj']}/{n_items} | 图 {totals['图']}/{n_items} | "
          f"html {totals['html']}/{n_items} | 清单 {totals['清单']}/{n_items}")
    all_ok = all(totals[k] == n_items for k in totals)
    print(f"\n结果: {'✅ 全部就绪，可进入阶段⑦总审' if all_ok else '⚠️ 存在未完成项，按 ✗ 补齐后再总审'}")

if __name__ == "__main__":
    main()
