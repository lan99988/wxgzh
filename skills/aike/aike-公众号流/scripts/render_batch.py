#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-公众号流 · 批量渲染（0 图片 API）
用法: python render_batch.py <批次号> [--only NN] [--out-root DIR] [--dry]
对 批次/批次-<批次号>/*/render.json 逐篇渲染（统一批次制 2026-08-20；兼容回退旧 审核/批次-<批次号>）:
  render.json 格式:
  {
    "cover": {"template": "cover-research", "palette": "暖灰",
              "fields": {"num": "01 / AI x WORK", "title": "...", "sub": "...", "meta": "..."}},
    "cards": [ {"template": "card-definition", "fields": {"num":"01","label":"CONTEXT","title":"...","body":"...","note":"..."}}, ... ]
  }
  字段 key = 模板中的 CSS class 名；items 类字段用 \n 分隔多行（自动转 <br>）
产出: 每篇 imgs/cover.png (2048x880) + imgs/card-NN.png (1242x1656)
"""
import sys, os, re, json, shutil, subprocess, tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))
RENDER_DIR = os.path.join(AIKE_ROOT, "render")
STYLE_DIR = os.path.join(AIKE_ROOT, "风格")

SIZES = {"cover": (1024, 440), "card": (621, 828), "1x1": (1024, 1024)}  # @2x -> 2048x880 / 1242x1656 / 2048x2048

def output_imgs_dir(item_dir, batch_dir, out_root=None):
    """返回图片输出目录；out_root 用于双引擎对照，保留批次/文章目录层级。"""
    if not out_root:
        return os.path.join(item_dir, "imgs")
    relative_item = os.path.relpath(item_dir, os.path.dirname(batch_dir))
    return os.path.join(out_root, relative_item, "imgs")

def replace_by_class(html: str, cls: str, text: str) -> str:
    """替换 class=cls 元素的内文（保留标签与属性）。
    按同类标签配平，定位该元素自己的闭合标签——不再停在第一个内层闭合（修 items/body/before/after/code 等嵌套泄漏）。
    注：模板字段元素均为 <div>/<span>，同类嵌套时深度计数；未找到闭合（模板异常）则保留原内容、仅在开头插入文本。"""
    text = text.replace("\n", "<br>")
    open_pat = re.compile(r'(<([a-zA-Z0-9]+)\b[^>]*class="[^"]*\b' + re.escape(cls) + r'\b[^"]*"[^>]*>)', re.S)
    n = 0
    def find_close(start: int, tag: str) -> int:
        """从 start 起配平同类标签，返回该元素闭合 </tag> 之后的位置；未找到返回 start"""
        depth = 1
        for cm in re.finditer(r'<' + tag + r'\b[^>]*>|</' + tag + r'>', html[start:], re.I):
            if cm.group(0).startswith('</'):
                depth -= 1
                if depth == 0:
                    return start + cm.end()
            else:
                depth += 1
        return start
    out, pos = [], 0
    for m in open_pat.finditer(html):
        out.append(html[pos:m.start()])
        tag = m.group(2).lower()
        end = find_close(m.end(), tag)
        if end == m.end():           # 无闭合（如 <hr>）：保留原结构，仅插入文本
            out.append(m.group(1) + text)
            pos = m.end()
        else:
            out.append(m.group(1) + text + '</' + tag + '>')
            pos = end
        n += 1
    out.append(html[pos:])
    return ''.join(out), n

def render_one(render_cli, tmp_dir, template, palette, fields, kind, out_png):
    """渲染单张图。kind: cover(2.35:1) / card(3:4)"""
    src = os.path.join(RENDER_DIR, f"{template}.html")
    if not os.path.exists(src):
        print(f"    [x] 模板不存在: {template}"); return False
    os.makedirs(tmp_dir, exist_ok=True)
    job_tmp = tempfile.mkdtemp(prefix="render-", dir=tmp_dir)
    with open(src, encoding="utf-8") as f: html = f.read()
    missed = []
    for cls, text in fields.items():
        html, n = replace_by_class(html, cls, str(text))
        if n == 0: missed.append(cls)
    # 注入配色 + 依赖文件
    for dep in ["_tokens.css", "_grid.css", "_palette.css", "_fonts.css", "_platform.css", "_fit.js"]:
        p = os.path.join(RENDER_DIR, dep)
        if os.path.exists(p): shutil.copy(p, os.path.join(job_tmp, dep))
    font_dir = os.path.join(RENDER_DIR, "fonts")
    if os.path.isdir(font_dir):
        shutil.copytree(font_dir, os.path.join(job_tmp, "fonts"), dirs_exist_ok=True)
    else:
        print("    [!] 本地字体文件缺失，将使用系统字体回退")
    if palette:
        pal = os.path.join(STYLE_DIR, palette, "palette.css")
        if os.path.exists(pal):
            shutil.copy(pal, os.path.join(job_tmp, "_palette.css"))
        else:
            print(f"    [!] 配色不存在: {palette}（用模板默认）")
    tmp_html = os.path.join(job_tmp, f"{template}-{kind}.html")
    with open(tmp_html, "w", encoding="utf-8") as f: f.write(html)
    visual_engine = os.path.dirname(os.path.dirname(render_cli))
    staged_png = out_png + ".rendering.png"
    cmd = ["node", "--import", "tsx", render_cli, "--html", tmp_html, "--out", staged_png, "--size", kind]
    try:
        r = subprocess.run(cmd, cwd=visual_engine, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=90)
    except subprocess.TimeoutExpired:
        print(f"    [x] 渲染超时: {template}")
        if os.path.exists(staged_png): os.remove(staged_png)
        shutil.rmtree(job_tmp, ignore_errors=True)
        return False
    if r.returncode == 0 and os.path.exists(staged_png):
        os.replace(staged_png, out_png)
        print(f"    [ok] {os.path.basename(out_png)}  ({template}/{palette or '默认'})")
        if missed: print(f"    [!] 未匹配字段: {missed}")
        if r.stdout and r.stdout.strip(): print("    " + r.stdout.strip().replace("\n", "\n    "))
        shutil.rmtree(job_tmp, ignore_errors=True)
        return True
    if os.path.exists(staged_png): os.remove(staged_png)
    print(f"    [x] 渲染失败: {template}  {(r.stderr or r.stdout or '')[:500]}")
    shutil.rmtree(job_tmp, ignore_errors=True)
    return False

def main():
    if len(sys.argv) < 2:
        print("用法: python render_batch.py <批次号> [--only NN] [--out-root DIR] [--dry]"); sys.exit(1)
    batch = sys.argv[1]
    only = None
    out_root = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
    if "--out-root" in sys.argv:
        out_root = sys.argv[sys.argv.index("--out-root") + 1]
    dry = "--dry" in sys.argv
    visual_engine = os.path.join(AIKE_ROOT, "visual-engine")
    if not os.path.isdir(visual_engine):
        visual_engine = os.path.abspath(os.path.join(AIKE_ROOT, "..", "visual-engine"))
    render_cli = os.path.join(visual_engine, "scripts", "render-html.ts")
    if not os.path.isfile(render_cli):
        print(f"[x] 未找到 Playwright HTML 渲染器: {render_cli}"); sys.exit(1)
    batch_dir = os.path.join(AIKE_ROOT, "批次", f"批次-{batch}")
    if not os.path.isdir(batch_dir):   # 兼容回退旧目录（过渡期旧批次）
        batch_dir = os.path.join(AIKE_ROOT, "审核", f"批次-{batch}")
    if not os.path.isdir(batch_dir):
        print(f"[x] 批次目录不存在: {batch_dir}"); sys.exit(1)
    items = sorted(d for d in os.listdir(batch_dir)
                   if os.path.isdir(os.path.join(batch_dir, d)) and not d.startswith('.'))
    if only: items = [d for d in items if d.startswith(only.zfill(2) + '-') or d.startswith(only)]
    if not items:
        print("[x] 没有可渲染的篇目"); sys.exit(1)

    tmp_dir = os.path.join(RENDER_DIR, "_tmp")
    total_ok = 0
    total_failed = 0
    for it in items:
        d = os.path.join(batch_dir, it)
        rj = os.path.join(d, "render.json")
        if not os.path.exists(rj):
            print(f"[!] {it}: 无 render.json，跳过"); continue
        with open(rj, encoding="utf-8") as f: cfg = json.load(f)
        imgs = output_imgs_dir(d, batch_dir, out_root); os.makedirs(imgs, exist_ok=True)
        print(f"== {it} ==")
        if "cover" in cfg:
            c = cfg["cover"]
            ok = render_one(render_cli, tmp_dir, c.get("template", "cover-research"), c.get("palette"),
                            c.get("fields", {}), "cover", os.path.join(imgs, "cover.png"))
            total_ok += int(ok); total_failed += int(not ok)
        if "xhs_cover" in cfg:  # 小红书 3:4 封面（可选）
            x = cfg["xhs_cover"]
            ok = render_one(render_cli, tmp_dir, x.get("template", "cover-research"),
                            x.get("palette") or cfg.get("cover", {}).get("palette"),
                            x.get("fields", {}), "card", os.path.join(imgs, "xhs-cover.png"))
            total_ok += int(ok); total_failed += int(not ok)
        if "cover_1x1" in cfg:  # 公众号 1:1 转发封面（朋友圈/群分享卡片，2048x2048）
            o = cfg["cover_1x1"]
            ok = render_one(render_cli, tmp_dir, o.get("template", "cover-system"),
                            o.get("palette") or cfg.get("cover", {}).get("palette"),
                            o.get("fields", {}), "1x1", os.path.join(imgs, "cover-1x1.png"))
            total_ok += int(ok); total_failed += int(not ok)
        for i, card in enumerate(cfg.get("cards", []), 1):
            ok = render_one(render_cli, tmp_dir, card.get("template", "card-definition"),
                            card.get("palette") or cfg.get("cover", {}).get("palette"),
                            card.get("fields", {}), "card",
                            os.path.join(imgs, f"card-{i:02d}.png"))
            total_ok += int(ok); total_failed += int(not ok)
        if dry: break
    print(f"\n== 渲染完成：成功 {total_ok} 张，失败 {total_failed} 张 ==")
    shutil.rmtree(tmp_dir, ignore_errors=True)
    if total_failed: sys.exit(2)

if __name__ == "__main__":
    main()
