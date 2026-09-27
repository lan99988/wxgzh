# -*- coding: utf-8 -*-
"""
fix_skin.py — 公众号栏目主题皮肤系统 v1.4.1（AI 科普视觉系统规范修正版）
隶属 aike-皮肤注入 skill，是「固定阅读基底 + 栏目环境色 + 图片自由」三层配色系统的
第二层（栏目环境色）落地脚本。

读取 convert.mjs(kami) 产出的 article_raw.html，做基础修复后按「栏目皮肤」注入配色，
输出 article.html(预览/base64) 与 article_publish.html(发布/相对路径)。

三层配色：
  第一层 品牌阅读基底（固定）：纸张 #F7F5EF(≈kami #f5f4ed) / 正文 #252525 / 标题 #1A1A1A / 辅助 #6B6B66
  第二层 栏目环境色（变化）：边框(结构线) + 顶标卡 + 代码块背景
  第三层 图片色（自由）：render 模板已烘焙（与本脚本无关）

v1.4.1 关键修正：
  - System 主题删除荧光绿 #39FF14；改为 AI Lab System 深黑档案风
    黑模块 #1A1A1A / 主字 #EFEAE0 / 次字 #B8C9B8 / 强调 #D97757 / 代码 #0D0D0D 奶字 #EFEAE0 关键词 #8FA9C7
  - 五种皮肤明确「边框色(结构, 用于 h2 左栏)」与「强调色(≤1%, 用于顶标文字点缀)」分工
  - 正文基色从 kami #141413 软化到 #252525（禁止纯黑手机端过锐）

本脚本不修改 kami 主题本身（convert.mjs），只在它之后做后处理注入。
"""
import base64
import os
import re
import sys

# border : h2 左栏等结构线（栏目色，浅/深但不刺眼）
# accent : 顶标文字等 ≤1% 强调点缀（醒目但不 flood）
# card   : 顶标背景 / 信息卡 / 引用块环境色
# code_bg / code_ink : 代码块配色
# top_tag_extra : 顶标 span 额外 style（= "color:{accent};"）
# ink : strong 等可读强调文字（固定近黑 #1A1A1A，避免强调色 flood）
SKINS = {
    "research_paper": {  # Skin A · AI 原理/入门
        "border": "#D8D5CF", "accent": "#BA7517", "card": "#EFEEE8",
        "code_bg": "#EFEEE8", "code_ink": "#1A1A1A", "ink": "#1A1A1A",
        "top_tag_extra": "color:#BA7517;", "div_border": "#D8D5CF",
    },
    "field_notes": {  # Skin B · 工具测试/实验
        "border": "#B8C9B8", "accent": "#6B8A6F", "card": "#EEF3ED",
        "code_bg": "#EEF3ED", "code_ink": "#1A1A1A", "ink": "#1A1A1A",
        "top_tag_extra": "color:#6B8A6F;", "div_border": "#B8C9B8",
    },
    "workflow_blue": {  # Skin C · 工作流/教程
        "border": "#8FA9C7", "accent": "#3F5C7A", "card": "#EEF2F7",
        "code_bg": "#EEF2F7", "code_ink": "#1A1A1A", "ink": "#1A1A1A",
        "top_tag_extra": "color:#3F5C7A;", "div_border": "#8FA9C7",
    },
    "system_dark": {  # Skin D · Agent/编程/自动化（AI Lab System，禁荧光绿）
        "border": "#1A1A1A", "accent": "#D97757", "card": "#1A1A1A",
        "code_bg": "#0D0D0D", "code_ink": "#EFEAE0", "ink": "#1A1A1A",
        "top_tag_extra": "color:#D97757;", "div_border": "#262626",
    },
    "editorial_orange": {  # Skin E · 趋势/观点/职场
        "border": "#D97757", "accent": "#D97757", "card": "#F7EDE8",
        "code_bg": "#F7EDE8", "code_ink": "#1A1A1A", "ink": "#1A1A1A",
        "top_tag_extra": "color:#D97757;", "div_border": "#D97757",
    },
}

NAVY = "#1B365D"
NAVY_TINT = "#EEF2F7"
PAPER = "#f5f4ed"  # = #F7F5EF（kami 渲染值，视觉等价，全篇统一不替换）


def main():
    if len(sys.argv) < 3:
        print("usage: fix_skin.py <article_dir> <skin_name>")
        sys.exit(1)
    article_dir = sys.argv[1]
    skin_name = sys.argv[2]
    if skin_name not in SKINS:
        print("unknown skin:", skin_name, "->", list(SKINS))
        sys.exit(1)
    S = SKINS[skin_name]
    html_path = os.path.join(article_dir, "article_raw.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    def count(pat):
        return len(re.findall(pat, html))

    print("=== [%s] BEFORE ===" % skin_name)
    print("&quot;:", count(r"&quot;"), " ^角标:", count(r'\^[a-c][0-9]+'), " <pre>:", count(r'<pre\s'))

    # ---- fix 1: &quot; -> 中文引号 ----
    parts = html.split("&quot;")
    out = parts[0]
    for i in range(1, len(parts)):
        out += ("\u201c" if i % 2 == 1 else "\u201d") + parts[i]
    html = out

    # ---- fix 2: &lt; &gt; &amp; ----
    html = html.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")

    # ---- fix 3: body bg ----
    html = html.replace('<body style="margin: 0; padding: 0;">',
                        '<body style="margin: 0; padding: 0; background-color:%s;">' % PAPER, 1)

    # ---- fix 4: ^a1 -> <sup> ----
    sup_before = len(re.findall(r'\^[a-c][0-9]+', html))
    html = re.sub(r'\^([a-c])([0-9]+)',
                  r'<sup style="font-size:0.72em;color:#9ca3af;">[\1\2]</sup>', html)
    print("sup:", sup_before, "->", len(re.findall(r'\^[a-c][0-9]+', html)))

    # ---- fix 5: <pre><code> -> 栏目代码块 ----
    def convert_pre_to_div(match):
        full = match.group(0)
        cm = re.search(r'<code[^>]*>(.*?)</code>', full, re.DOTALL)
        if not cm:
            return full
        content = cm.group(1)
        lines = content.split('\n')
        conv = []
        for i, line in enumerate(lines):
            if line.strip() == '':
                conv.append('<br>')
            else:
                stripped = line.lstrip(' ')
                lead = len(line) - len(stripped)
                seg = ('&nbsp;' * lead + stripped) if lead > 0 else line
                if i < len(lines) - 1:
                    seg += '<br>'
                conv.append(seg)
        inner = ''.join(conv)
        style = (
            "font-family:'JetBrains Mono','SF Mono','Fira Code',Consolas,monospace;"
            "font-size:14px;color:%s;background-color:%s;"
            "padding:14px 16px;border-radius:6px;margin:0 0 20px;line-height:1.7;"
            "border:1px solid %s;" % (S["code_ink"], S["code_bg"], S["div_border"])
        )
        return '<div style="%s">%s</div>' % (style, inner)

    pre_before = count(r'<pre\s')
    html = re.sub(r'<pre[^>]*><code[^>]*>.*?</code></pre>', convert_pre_to_div, html, flags=re.DOTALL)
    print("pre->div:", pre_before - count(r'<pre\s'))

    # ===== 栏目皮肤注入（顺序敏感） =====
    # (a) inline code 特定替换（必须先于通用替换，避免 System 黑底不可见）
    html = html.replace("background-color:%s;color:%s;" % (NAVY_TINT, NAVY),
                        "background-color:%s;color:%s;" % (S["code_bg"], S["code_ink"]))
    # (b) h2/h3 左栏 / callout 引用盒 结构线 -> border 色（正则覆盖所有 px 宽度）
    def _repl_border(m):
        return "border-left:%s solid %s" % (m.group(1), S["border"])
    html = re.sub(r'border-left:(\d+px) solid %s' % NAVY, _repl_border, html)
    # (c) 通用文字强调（顶标文字 / strong / 引用文字）-> ink（近黑，不 flood）
    html = html.replace("color:%s" % NAVY, "color:%s" % S["ink"])
    # (d) 环境背景（顶标背景 / 引用背景 / 信息卡）-> card
    html = html.replace("background-color:%s" % NAVY_TINT,
                        "background-color:%s" % S["card"])
    # (e) 顶标点缀强调色（≤1%）
    html = html.replace(
        "background-color:%s;padding:2px 8px;border-radius:3px;" % S["card"],
        "background-color:%s;%spadding:2px 8px;border-radius:3px;"
        % (S["card"], S["top_tag_extra"]),
    )

    # ===== 第一层 基础阅读层软化（v1.4.1） =====
    # h1 标题 -> #1A1A1A（先于 blanket，避免被改成 #252525）
    html = html.replace(
        "color:#141413;word-break:break-word;background-color:#f5f4ed;font-size:29px",
        "color:#1A1A1A;word-break:break-word;background-color:#f5f4ed;font-size:29px")
    # 正文/次级标题 -> #252525（禁止纯黑）
    html = html.replace("color:#141413", "color:#252525")
    # 图注辅助文字 -> #6B6B66
    html = html.replace("color:#87867f", "color:#6B6B66")

    # ---- 发布版（保留相对路径）在 base64 之前切出 ----
    pub_html = html

    # ---- fix 6: table wrap ----
    def wrap_table(m):
        return '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 20px;">' + m.group(0) + '</div>'
    html = re.sub(r'<table[^>]*>.*?</table>', wrap_table, html, flags=re.DOTALL)
    pub_html = re.sub(r'<table[^>]*>.*?</table>', wrap_table, pub_html, flags=re.DOTALL)

    # ---- fix 9: base64 内嵌（仅预览用） ----
    def embed(m):
        sm = re.search(r'src="([^"]+)"', m.group(0))
        if not sm:
            return m.group(0)
        src = sm.group(1)
        if src.startswith("data:"):
            return m.group(0)
        path = os.path.join(article_dir, src)
        if not os.path.exists(path):
            print("  [warn] image not found:", src)
            return m.group(0)
        with open(path, "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode()
        return m.group(0).replace('src="%s"' % src, 'src="data:image/png;base64,%s"' % b64)
    html = re.sub(r'<img[^>]*src="[^"]+"[^>]*>', embed, html)

    with open(os.path.join(article_dir, "article.html"), "w", encoding="utf-8") as f:
        f.write(html)
    with open(os.path.join(article_dir, "article_publish.html"), "w", encoding="utf-8") as f:
        f.write(pub_html)

    print("=== [%s] AFTER ===" % skin_name)
    print("navy left:", count(r'border-left:4px solid %s' % NAVY),
          " navy text:", html.count("color:%s" % NAVY),
          " navy_tint:", html.count("background-color:%s" % NAVY_TINT))
    print("border bar:", html.count("border-left:4px solid %s" % S["border"]),
          " card bg:", html.count("background-color:%s" % S["card"]),
          " base64:", html.count("data:image/png;base64,"))
    print("done -> article.html (preview) + article_publish.html (publish)")


if __name__ == "__main__":
    main()
