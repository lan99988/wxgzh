# -*- coding: utf-8 -*-
"""给 11 个模板的主要文本元素加 data-fit 属性，并在 </body> 前引入 _fit.js。"""
import os, glob
from pathlib import Path

RENDER = str(Path(__file__).resolve().parent)
SCRIPT = '<script src="_fit.js"></script>\n'

# 模板 → [(old, new)] 元素替换
FIT = {
    "cover-research.html":    [('class="title"', 'class="title" data-fit')],
    "cover-editorial.html":   [('class="title"', 'class="title" data-fit')],
    "cover-fieldnotes.html":  [('<div class="body">', '<div class="body" data-fit>')],
    "cover-system.html":      [('class="title"', 'class="title" data-fit'),
                               ('class="io"', 'class="io" data-fit')],
    "cover-statement.html":   [('class="stmt"', 'class="stmt" data-fit')],
    "card-definition.html":   [('class="title"', 'class="title" data-fit')],
    "card-beforeafter.html":  [('<div class="before">', '<div class="before" data-fit>'),
                               ('<div class="after">', '<div class="after" data-fit>')],
    "card-framework.html":    [('<div class="items">', '<div class="items" data-fit>')],
    "card-checklist.html":    [('<div class="items">', '<div class="items" data-fit>')],
    "card-example.html":      [('<div class="code">', '<div class="code" data-fit>')],
    "card-statement.html":    [('class="stmt"', 'class="stmt" data-fit>')],
}

for name, pairs in FIT.items():
    path = os.path.join(RENDER, name)
    with open(path, encoding="utf-8") as fh:
        html = fh.read()
    for old, new in pairs:
        if old not in html:
            print("!! 未找到:", name, old)
        html = html.replace(old, new, 1)
    if SCRIPT.strip() not in html:
        html = html.replace("</body>", SCRIPT + "</body>", 1)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("OK", name)
print("== done ==")
