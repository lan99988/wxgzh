#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 批次初始化
用法: python init_batch.py <批次号> <素材目录> [--dry]
  批次号   如 20260816（或任意标识）
  素材目录 素材/批次-YYYYMMDD/ 下每个子文件夹 = 一个素材
产出（统一批次制，2026-08-20 起）:
  批次/批次-<批次号>/
  ├── 批次编排表.md
  └── NN-<slug>/  (article.md / xhs-note.md / render.json / imgs/ / 发布清单.txt)
"""
import sys, os, re, shutil

# ---- 路径 ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)                      # aike-公众号流
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)                   # .workbuddy
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))  # ai科普
BATCH_ROOT = os.path.join(AIKE_ROOT, "批次")
TPL_DIR = os.path.join(SKILL_DIR, "templates")

PLACEHOLDERS = {
    "article.md": "# 文章标题\n\n> 素材：[素材名]\n> 类型：[科普/观点/工具/技术/金句]\n\n<!-- 通俗易懂风格改写稿，按 文章结构-模板.md 写作，文末附 G2 六条自评表 -->\n",
    "xhs-note.md": "# 小红书笔记\n\n> 标题候选（2~3 个，≤20 字）：\n> 1. \n> 2. \n> 3. \n\n<!-- 正文：钩子 2 句 → 要点 3~5 → 总结+互动；600~1000 字；emoji ≤3；#标签 3~5 个（首 #AI科普） -->\n",
    "render.json": "{}\n",
    "发布清单.txt": "【发布清单】\n标题（选定后填）：\n正文（见 xhs-note.md）：\n图片顺序：imgs/cover.png → imgs/card-01.png → ...\n发布时间段：12:00~13:00 或 19:00~22:00\n",
}

def slugify(name: str) -> str:
    """素材文件夹名 → slug：去「制作中-」「已完成-」前缀与非法字符，保中文"""
    s = re.sub(r'^(制作中|已完成)[-_]', '', name.strip())
    s = re.sub(r'[\\/:*?"<>|]', '-', s)
    return s.strip() or "untitled"

def build_row(i, slug, src):
    return f"| {i:02d} | {slug} | {src} |  | 未开始 | 未开始 | 未开始 | 未开始 | 未开始 | 未开始 |\n"

def main():
    if len(sys.argv) < 3:
        print("用法: python init_batch.py <批次号> <素材目录> [--dry]"); sys.exit(1)
    batch, src_dir = sys.argv[1], sys.argv[2]
    dry = "--dry" in sys.argv
    if not os.path.isdir(src_dir):
        print(f"[x] 素材目录不存在: {src_dir}"); sys.exit(1)
    mats = sorted(d for d in os.listdir(src_dir)
                  if os.path.isdir(os.path.join(src_dir, d)) and not d.startswith('.'))
    if not mats:
        print("[x] 素材目录下没有子文件夹（每个素材一个文件夹）"); sys.exit(1)
    if len(mats) < 10:
        print(f"[!] 警告：仅 {len(mats)} 个素材（批量建议 ≥10）")

    batch_dir = os.path.join(BATCH_ROOT, f"批次-{batch}")
    if os.path.exists(batch_dir) and not dry:
        print(f"[x] 批次已存在: {batch_dir}（如需重建请先改名/移动）"); sys.exit(1)

    print(f"== 初始化批次 {batch} | 素材 {len(mats)} 个 | {'DRY' if dry else '实写'} ==")
    for i, m in enumerate(mats, 1):
        slug = f"{i:02d}-{slugify(m)}"
        d = os.path.join(batch_dir, slug)
        if dry:
            print(f"  [dry] {d}"); continue
        os.makedirs(os.path.join(d, "imgs"), exist_ok=True)
        for fn, content in PLACEHOLDERS.items():
            with open(os.path.join(d, fn), "w", encoding="utf-8") as f:
                f.write(content.replace("[素材名]", m))
        print(f"  [ok] {slug}")

    if dry: sys.exit(0)

    # 编排表：模板只提供表头 + 映射/说明，真实行由本脚本生成
    tpl = os.path.join(TPL_DIR, "批次编排表-模板.md")
    table_head = "| 篇 | slug | 素材 | 类型 | ①选题 | ④改写 | ⑤配图 | ⑥排版 | ⑦总审 | ⑧发布 |\n|---|---|---|---|---|---|---|---|---|---|\n"
    table_tail = ""
    if os.path.exists(tpl):
        with open(tpl, encoding="utf-8") as f: tpl_text = f.read()
        lines = tpl_text.splitlines()
        head = [ln for ln in lines if ln.strip().startswith("|")]
        if len(head) >= 2:
            table_head = "\n".join(head[:2]) + "\n"
        first = head[0] if head else table_head.splitlines()[0]
        idx = tpl_text.find(first)
        if idx >= 0:
            rest = tpl_text[idx + len(first):].splitlines()
            # 跳过前导空行与表头后的第一个分隔行，其余（映射表/说明）作 tail 原样保留
            while rest and not rest[0].strip():
                rest = rest[1:]
            if rest and rest[0].strip().startswith("|---"):
                rest = rest[1:]
            table_tail = "\n".join(rest).strip()
    rows = "".join(build_row(i, f"{i:02d}-{slugify(m)}", m) for i, m in enumerate(mats, 1))
    header = f"# 批次编排表 - {batch}\n\n> 素材数：{len(mats)} ｜ 状态：未开始/进行中/待确认/已确认/打回 ｜ 打回单篇不阻塞整批\n\n"
    with open(os.path.join(batch_dir, "批次编排表.md"), "w", encoding="utf-8") as f:
        f.write(header + table_head + rows)
        if table_tail:
            f.write("\n" + table_tail + "\n")
    print(f"\n== 完成 ==\n批次目录: {batch_dir}")
    print(f"编排表:   {os.path.join(batch_dir, '批次编排表.md')}")
    print("下一步: 填编排表类型列 → 阶段②素材/③加工 → ④改写")

if __name__ == "__main__":
    main()
