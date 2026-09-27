#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 全流水线后半段一键收尾（纯本地，不吃模型额度）
用法: python finalize_articles.py <批次号> [--only NN1,NN2|NN-NN] [--dry]
对指定篇目依次完成:
  1. 生成 article_配图版.md（在 article.md 的 H1 后插封面、各小节后按序号插 card-NN.png）
  2. convert.mjs (kami) → article_raw.html
  3. fix_skin.py <皮肤> → article.html + article_publish.html（皮肤由 render.json palette 推导）
  4. make_tiepai.py → 贴图版/（独立于 kami 排版的图卡版）
  5. PIL 尺寸 + 产物存在性自检
产出每篇一行状态。整批发布清单由主控最后统一 gen_xhs_checklist。
"""
import sys, os, re, json, subprocess, shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
AIKE_DIR = os.path.dirname(SKILL_DIR)
AIKE_ROOT = os.path.dirname(os.path.dirname(AIKE_DIR))
SKILLS = AIKE_DIR
PY = sys.executable
NODE = os.environ.get("NODE_BINARY") or shutil.which("node") or "node"
CONVERT = os.environ.get("WECHAT_HTML_CONVERTER", "")
FIX_SKIN = os.path.join(SKILLS, "aike-皮肤注入", "scripts", "fix_skin.py")
MAKE_TIEPAI = os.path.join(SKILLS, "aike-公众号流", "scripts", "make_tiepai.py")

PALETTE2SKIN = {
    "暖灰": "research_paper",
    "鼠尾草绿": "field_notes",
    "深黑": "system_dark",
    "陶土橙": "editorial_orange",
    "雾霾蓝": "editorial_orange",
}
SIZE_OK = {"cover.png": (2048, 880), "cover-1x1.png": (2048, 2048),
           "xhs-cover.png": (1242, 1656)}

def gen_peituban(adir: str) -> str:
    """article.md → article_配图版.md（封面插 H1 后，card-NN 插在 ## N. 小节标题后）"""
    md = os.path.join(adir, "article.md")
    out = os.path.join(adir, "article_配图版.md")
    with open(md, encoding="utf-8") as f: lines = f.read().splitlines()
    # 收集已渲染卡片
    imgs = os.path.join(adir, "imgs")
    cards = sorted(f for f in os.listdir(imgs) if re.fullmatch(r"card-\d{2}\.png", f)) if os.path.isdir(imgs) else []
    res, h1_done = [], False
    sec_pat = re.compile(r"^##\s+(\d+)[\.\s、]")
    used = 0
    for ln in lines:
        res.append(ln)
        if not h1_done and ln.startswith("# "):
            res.append("")
            res.append("![封面](imgs/cover.png)")
            res.append("")
            h1_done = True
            continue
        m = sec_pat.match(ln)
        if m and used < len(cards):
            n = int(m.group(1))
            if 1 <= n <= len(cards):
                res.append("")
                res.append(f"![卡片{n:02d}](imgs/card-{n:02d}.png)")
                res.append("")
                used += 1
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(res) + "\n")
    return out

def run(cmd, cwd=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r

def main():
    if len(sys.argv) < 2:
        print("用法: python finalize_articles.py <批次号> [--only NN1,NN2|NN-NN] [--dry]"); sys.exit(1)
    batch = sys.argv[1]
    dry = "--dry" in sys.argv
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
    batch_dir = os.path.join(AIKE_ROOT, "批次", f"批次-{batch}")
    if not os.path.isdir(batch_dir):
        print(f"[x] 批次目录不存在: {batch_dir}"); sys.exit(1)
    dirs = sorted(d for d in os.listdir(batch_dir) if os.path.isdir(os.path.join(batch_dir, d)) and not d.startswith("."))
    if only:
        sel = []
        for tok in only.split(","):
            tok = tok.strip()
            if "-" in tok and not tok.startswith("-"):
                a, b = tok.split("-")
                sel += [f"{i:02d}" for i in range(int(a), int(b) + 1)]
            else:
                sel.append(tok.zfill(2))
        dirs = [d for d in dirs if any(d.startswith(s + "-") or d == s for s in sel)]
    if not dirs:
        print("[x] 没有匹配的篇目"); sys.exit(1)

    if not dry and not CONVERT:
        print("[x] 请先通过 WECHAT_HTML_CONVERTER 指定 Markdown 转换脚本路径"); sys.exit(2)
    print(f"== finalize {batch} | {len(dirs)} 篇 | {'DRY' if dry else '实跑'} ==")
    summary = []
    for d in dirs:
        adir = os.path.join(batch_dir, d)
        rj = os.path.join(adir, "render.json")
        if not os.path.exists(rj):
            summary.append((d, "SKIP", "无 render.json")); continue
        try:
            with open(rj, encoding="utf-8") as f: cfg = json.load(f)
        except Exception as e:
            summary.append((d, "SKIP", f"render.json 解析失败: {e}")); continue
        pal = (cfg.get("cover") or {}).get("palette", "")
        skin = PALETTE2SKIN.get(pal)
        if not skin:
            summary.append((d, "SKIP", f"palette 无法映射皮肤: {pal!r}")); continue
        if dry:
            summary.append((d, "DRY", f"skin={skin}")); continue

        errs = []
        # 1 配图版
        try:
            ptb = gen_peituban(adir)
        except Exception as e:
            errs.append(f"配图版失败: {e}"); ptb = None
        # 2 convert
        if ptb:
            r = run([NODE, CONVERT, ptb, "--theme", "kami", "--output", os.path.join(adir, "article_raw.html")], cwd=adir)
            if not os.path.exists(os.path.join(adir, "article_raw.html")):
                errs.append(f"convert 失败: {r.stderr[:150]}")
        # 3 fix_skin
        r = run([PY, FIX_SKIN, adir, skin])
        if not (os.path.exists(os.path.join(adir, "article.html")) and os.path.exists(os.path.join(adir, "article_publish.html"))):
            errs.append(f"fix_skin 失败: {r.stdout[-200:]} {r.stderr[:150]}")
        # 4 tiepai
        nn = re.match(r"(\d+)-", d).group(1)
        r = run([PY, MAKE_TIEPAI, batch, "--only", nn], cwd=AIKE_ROOT)
        if not os.path.exists(os.path.join(adir, "贴图版", "article.html")):
            errs.append(f"tiepai 失败: {r.stdout[-200:]}")
        # 5 校验
        try:
            from PIL import Image
        except ImportError:
            errs.append("PIL 不可用，跳过尺寸校验")
            Image = None
        imgs = os.path.join(adir, "imgs")
        if Image and os.path.isdir(imgs):
            for f, (w, h) in SIZE_OK.items():
                p = os.path.join(imgs, f)
                if not os.path.exists(p):
                    errs.append(f"缺 {f}"); continue
                try:
                    if Image.open(p).size != (w, h): errs.append(f"{f} 尺寸不符")
                except Exception as e:
                    errs.append(f"{f} 读取失败: {e}")
            for f in sorted(x for x in os.listdir(imgs) if re.fullmatch(r"card-\d{2}\.png", x)):
                p = os.path.join(imgs, f)
                if Image.open(p).size != (1242, 1656): errs.append(f"{f} 尺寸不符")
        for req in ["article.html", "article_publish.html", os.path.join("贴图版", "article.html"), "发布清单.txt"]:
            if not os.path.exists(os.path.join(adir, req)):
                errs.append(f"缺 {req}")
        summary.append((d, "OK" if not errs else "FAIL", "; ".join(errs) if errs else "skin=" + skin))
        print(f"  [{summary[-1][1]}] {d}  {'· ' + summary[-1][2] if summary[-1][2] != 'OK' else '全部通过'}")

    print("\n== 汇总 ==")
    for d, st, msg in summary:
        print(f"  {st:4s} {d}  {msg}")
    ok = sum(1 for _, st, _ in summary if st == "OK")
    print(f"\nOK {ok}/{len(summary)}")

if __name__ == "__main__":
    main()
