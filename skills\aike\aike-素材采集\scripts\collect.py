#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""aike-素材采集 · 从 txt 链接清单批量抓取文章 → AI 分类 → 自动归档
用法:
  python collect.py                          # 读 ai科普/待收集.txt → 归档 ai科普/素材/
  python collect.py <txt路径>                # 指定清单文件
  python collect.py <txt路径> --out <目录>    # 指定素材根目录
  python collect.py <txt路径> --limit N       # 只处理前 N 条（试跑）
流程: 每行 URL → Jina Reader 抓正文 → qwen-turbo 分类(类型+主题) → 素材\<类别>\<slug>\
产出: 原文.md + 元数据.json + 来源.txt + 控制台汇总报告
"""
import sys, os, re, json, time, shutil, subprocess, urllib.request
from datetime import datetime

# ---------- 路径 ----------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
WORKBUDDY_DIR = os.path.dirname(SKILL_DIR)
AIKE_ROOT = os.path.dirname(os.path.dirname(WORKBUDDY_DIR))   # ai科普
DEFAULT_TXT = os.path.join(AIKE_ROOT, "待收集.txt")
DEFAULT_OUT = os.path.join(AIKE_ROOT, "素材")
ENV_FILE = os.path.expanduser("~/.baoyu-skills/.env")
PROXY = os.environ.get("AIKE_PROXY_URL", "").strip()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

CATEGORIES = ["科普", "观点", "工具", "技术", "金句", "未分类"]

CLASS_PROMPT = """你是 AI 科普公众号的素材编辑，对下面这篇文章做分类。

【文章类别】（必须且只能选 1 个）：
- 科普：AI 原理/概念解释/入门知识
- 观点：趋势分析/作者观点/行业评论
- 工具：AI 工具介绍/使用教程/实测体验
- 技术：Agent/编程/自动化/工作流/提示词工程
- 金句：短小观点/金句/金句集合

【主题标签】2~3 个，从候选选或自拟：AI职场、AI成长、AI学习、AI工具、AI效率、AI创作、AI编程、AI家庭、AI行业、AI原理
【摘要】一句话，30 字内

只返回 JSON（不要任何其他文字）：
{"category": "科普", "theme": ["AI工具", "AI效率"], "summary": "一句话摘要"}

文章标题：{title}

正文（截取）：
{content}"""


# ---------- 工具函数 ----------

def load_env():
    """读 ~/.baoyu-skills/.env（兼容 BOM），返回 dict"""
    env = {}
    if os.path.exists(ENV_FILE):
        for line in open(ENV_FILE, encoding="utf-8-sig"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def read_urls(txt_path):
    urls = []
    for line in open(txt_path, encoding="utf-8-sig"):
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("//"):
            continue
        u = line.split()[0] if line.split() else line
        if u.startswith("http"):
            urls.append(u)
    return urls


def fetch_jina(url, timeout=30):
    """Jina Reader 抓正文：先直连，失败走代理。返回 (title, content, meta) 或 None"""
    target = f"https://r.jina.ai/{url}"
    attempts = [{"name": "直连", "cmd": ["curl", "-s", "-m", str(timeout), "-A", UA, target]}]
    if PROXY:
        attempts.append({"name": "代理", "cmd": ["curl", "-s", "-x", PROXY, "-m", str(timeout), "-A", UA, target]})
    for att in attempts:
        try:
            r = subprocess.run(att["cmd"], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout + 10)
            out = r.stdout
            if not out.strip():
                continue
            # 错误拦截：Jina 对无效域名/错误页返回 JSON 错误或 Warning 行
            if any(k in out for k in ["SubmittedDataMalformedError", "could not be resolved", '"code":422',
                                      "Target URL returned error 404", "Target URL returned error 403",
                                      "Target URL returned error 410", "Target URL returned error 429"]):
                continue
            title, published = "", ""
            for line in out.splitlines()[:8]:
                if line.startswith("Title:"): title = line[6:].strip()
                elif line.startswith("Published Time:"): published = line[16:].strip()
            m = re.search(r"Markdown Content:\s*\n(.*)", out, re.S)
            content = m.group(1).strip() if m else out
            # 清理超长/空
            content = re.sub(r"\n{3,}", "\n\n", content)
            if len(content) < 50:
                continue
            # X 推文等场景：页面标题形如 "xx (@xx) on X"，正文首个标题更准确
            if (" on X" in title and "@" in title) or not title:
                m2 = re.search(r"^#\s+(.+?)\s*$", content, re.M)
                t2 = m2.group(1).strip() if m2 else ""
                if not t2:
                    # 退而求其次：正文第一个有意义的非空行（跳过图片/引文/链接行）
                    for ln in content.splitlines():
                        ln = ln.strip()
                        if ln and not ln.startswith(("![", ">", "http", "|")):
                            t2 = ln
                            break
                if t2 and len(t2) < 60:
                    title = t2
            return title or url, content, {"published": published, "via": att["name"]}
        except Exception:
            continue
    return None


def classify(title, content, api_key):
    """qwen-turbo 分类 → (category, theme, summary)"""
    prompt = CLASS_PROMPT.replace("{title}", title[:200]).replace("{content}", content[:2500])
    body = json.dumps({
        "model": "qwen-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.1,
    }).encode()
    req = urllib.request.Request(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        data=body, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
    for attempt in range(2):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=30))
            txt = r["choices"][0]["message"]["content"].strip()
            m = re.search(r"\{.*\}", txt, re.S)
            d = json.loads(m.group(0)) if m else {}
            cat = d.get("category", "未分类")
            if cat not in CATEGORIES:
                # 容错：匹配最接近的
                for c in CATEGORIES[:-1]:
                    if c in cat: cat = c; break
                else: cat = "未分类"
            theme = d.get("theme", [])[:4]
            if isinstance(theme, str): theme = [theme]
            return cat, theme, str(d.get("summary", ""))[:60]
        except Exception:
            if attempt == 0: time.sleep(2)
    return "未分类", [], ""


def slugify(title):
    s = re.sub(r'[\\/:*?"<>|\r\n\t]', '-', title.strip())
    s = re.sub(r'\s+', ' ', s)
    return s[:40].rstrip('-. ') or "untitled"


def main():
    txt = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else DEFAULT_TXT
    out_root = DEFAULT_OUT
    limit = None
    if "--out" in sys.argv:
        out_root = sys.argv[sys.argv.index("--out") + 1]
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    if not os.path.exists(txt):
        print(f"[x] 清单文件不存在: {txt}"); sys.exit(1)
    urls = read_urls(txt)
    if not urls:
        print(f"[x] 清单里没有有效 URL（{txt}）"); sys.exit(1)
    if limit: urls = urls[:limit]

    env = load_env()
    api_key = env.get("DASHSCOPE_API_KEY", "")
    if not api_key:
        print(f"[x] 未找到 DASHSCOPE_API_KEY（{ENV_FILE}）"); sys.exit(1)

    print(f"== aike-素材采集 ==\n清单: {txt}（{len(urls)} 条）\n归档: {out_root}\n")
    os.makedirs(out_root, exist_ok=True)
    report = {"成功": [], "跳过(重复)": [], "抓取失败": [], "分类未定": []}
    t0 = time.time()

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] {url[:70]}")
        got = fetch_jina(url)
        if not got:
            report["抓取失败"].append(url)
            print("    ✗ 抓取失败")
            continue
        title, content, meta = got
        cat, theme, summary = classify(title, content, api_key)
        slug = slugify(title)
        dest = os.path.join(out_root, cat, slug)
        if os.path.exists(dest):
            report["跳过(重复)"].append(f"{cat}/{slug}")
            print(f"    · 已存在，跳过（{cat}/{slug}）")
            continue
        os.makedirs(dest, exist_ok=True)
        with open(os.path.join(dest, "原文.md"), "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n> 来源: {url} ｜ 抓取时间: {datetime.now():%Y-%m-%d %H:%M} ｜ {meta.get('published', '')}\n\n{content}\n")
        with open(os.path.join(dest, "来源.txt"), "w", encoding="utf-8") as f:
            f.write(url + "\n")
        meta_data = {
            "url": url, "title": title, "published": meta.get("published", ""),
            "category": cat, "theme": theme, "summary": summary,
            "collected_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        }
        with open(os.path.join(dest, "元数据.json"), "w", encoding="utf-8") as f:
            json.dump(meta_data, f, ensure_ascii=False, indent=2)
        report["成功"].append(f"{cat}/{slug}")
        if cat == "未分类":
            report["分类未定"].append(url)
        print(f"    ✓ [{cat}] {theme} ｜ {slug}")
        time.sleep(0.5)  # 温和限速

    # 汇总报告
    print("\n" + "=" * 60)
    print(f"采集完成：成功 {len(report['成功'])} ｜ 跳过 {len(report['跳过(重复)'])} ｜ 抓取失败 {len(report['抓取失败'])} ｜ 耗时 {time.time()-t0:.0f}s")
    if report["分类未定"]:
        print("⚠️ 以下 URL 分类未定（已入「未分类」目录，可手动调整）:")
        for u in report["分类未定"]: print("  ", u)
    if report["抓取失败"]:
        print("⚠️ 以下 URL 抓取失败（可检查链接有效性后重试）:")
        for u in report["抓取失败"]: print("  ", u)
    print("\n素材分布:")
    for c in CATEGORIES:
        d = os.path.join(out_root, c)
        if os.path.isdir(d):
            n = len([x for x in os.listdir(d) if os.path.isdir(os.path.join(d, x))])
            if n: print(f"  {c}: {n} 篇")


if __name__ == "__main__":
    main()
