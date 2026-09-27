# -*- coding: utf-8 -*-
"""批量把 render/*.html 的硬编码颜色改为 CSS 变量，并注入 :root 令牌 + palette.css 链接。"""
import os, re, glob
from pathlib import Path

RENDER = str(Path(__file__).resolve().parent)
VAR_MAP = [
    ("#F5F4ED", "var(--paper)"),
    ("#FAFAF6", "var(--paper-2)"),
    ("#1A1A1A", "var(--ink)"),
    ("#6B6B66", "var(--ink-2)"),
    ("#BA7517", "var(--accent)"),
    ("#B3261E", "var(--accent-2)"),
    ("#0D0D0D", "var(--bg-dark)"),
    ("#39FF14", "var(--term-green)"),
    ("#8FA8A0", "var(--term-gray)"),
    ("#B4B4B4", "var(--term-gray)"),
    ("#FFFFFF", "var(--ink)"),
]

ROOT_BLOCK = """  :root { --paper:#F5F4ED; --paper-2:#FAFAF6; --ink:#1A1A1A; --ink-2:#6B6B66;
           --accent:#BA7517; --accent-2:#B3261E; --bg-dark:#0D0D0D;
           --term-green:#39FF14; --term-gray:#8FA8A0; }
"""

LINK_TAG = '<link rel="stylesheet" href="_palette.css">'

for f in sorted(glob.glob(os.path.join(RENDER, "*.html"))):
    with open(f, encoding="utf-8") as fh:
        html = fh.read()
    for old, new in VAR_MAP:
        html = html.replace(old, new)
    # 注入 :root（放在第一个 <style> 内部开头）
    html = html.replace("<style>", "<style>\n" + ROOT_BLOCK, 1)
    # 注入 palette link（放在 </head> 前）
    html = html.replace("</head>", LINK_TAG + "\n</head>", 1)
    with open(f, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("OK", os.path.basename(f))
print("== done ==")
