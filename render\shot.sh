#!/bin/bash
# 批量渲染：render/*.html → render/out/
# 用法：bash shot.sh [配色名] [平台] [背景模式]
#   配色名：陶土橙/深黑/暖灰/鼠尾草绿/雾霾蓝（兼容英文 terracotta/inkblack/warmgray/sage/mistblue；缺省=默认暖米）
#   平台：小红书/公众号（兼容 xhs/redbook / gzh/wechat；缺省=公众号）
#   背景模式：color 纯色（默认）；img 可选纹理（需自行提供 paper-*.png）
#   小红书 → 标题字重 700(Bold)；公众号 → 600(SemiBold)
# 所有模板出 3:4（小红书卡 1242×1656 @2x）；封面母版另出 2.35:1（公众号封面 2048×880 @2x）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RENDER="${RENDER_DIR:-$SCRIPT_DIR}"
OUT="${OUT_DIR:-$RENDER/out}"
SKILLS="${STYLE_DIR:-$REPO_ROOT/风格}"
CHROME="${CHROME_BIN:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || command -v chrome || true)}"
PALETTE="${1:-}"
PLATFORM="${2:-公众号}"
MODE="${3:-color}"
# 智能解析：$1 既可能是配色也可能是平台
case "$PALETTE" in
  小红书|xhs|redbook|公众号|gzh|wechat)
    PLATFORM="$PALETTE"; PALETTE="";;
esac
# 中文/英文兼容映射
case "$PALETTE" in
  陶土橙|terracotta) PALETTE="陶土橙";;
  深黑|inkblack) PALETTE="深黑";;
  暖灰|warmgray) PALETTE="暖灰";;
  鼠尾草绿|sage) PALETTE="鼠尾草绿";;
  雾霾蓝|mistblue) PALETTE="雾霾蓝";;
esac
case "$PLATFORM" in
  小红书|xhs|redbook) PLATFORM="小红书";;
  公众号|gzh|wechat) PLATFORM="公众号";;
esac
case "$MODE" in
  img|image|图|底图|图片) MODE="img";;
  color|colour|纯色|色块|色) MODE="color";;
  *) MODE="color";;
esac
mkdir -p "$OUT"

PYTHON="${PYTHON_BIN:-python3}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then PYTHON="python"; fi
if [ -z "$CHROME" ]; then echo "!! 请安装 Chrome/Chromium 或设置 CHROME_BIN"; exit 1; fi

# 注入配色：cp palette.css → _palette.css（模板 <link> 引用）
if [ -n "$PALETTE" ]; then
  SRC="$SKILLS/$PALETTE/palette.css"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$RENDER/_palette.css"
    echo "== 配色: $PALETTE =="
  else
    echo "!! 未找到配色 $PALETTE，使用默认"; rm -f "$RENDER/_palette.css"
  fi
else
  rm -f "$RENDER/_palette.css"
  echo "== 配色: 默认暖米 =="
fi

# 背景模式：color（纯色）时把 _palette.css 中 --paper 的 url() 替换为 --paper-color 纯色值
if [ "$MODE" = "color" ] && [ -f "$RENDER/_palette.css" ]; then
  "$PYTHON" -c "
import re, sys
p = sys.argv[1]
with open(p, encoding='utf-8') as f: s = f.read()
m = re.search(r'--paper-color:\s*(#[0-9A-Fa-f]{6})', s)
if m:
    s = re.sub(r'--paper:\s*url\([^;]+\);', '--paper: ' + m.group(1) + ';', s)
    with open(p, 'w', encoding='utf-8') as f: f.write(s)
    print('  MODE: 纯色 (' + m.group(1) + ')')
" "$RENDER/_palette.css"
else
  echo "  MODE: 底图"
fi

# 注入平台字重：生成 _platform.css（模板 <link> 引用，覆盖 --title-weight）
if [ "$PLATFORM" = "小红书" ]; then
  printf ':root{--title-weight:700;}\n' > "$RENDER/_platform.css"
  echo "== 平台: 小红书（标题 Bold 700） =="
else
  printf ':root{--title-weight:600;}\n' > "$RENDER/_platform.css"
  echo "== 平台: 公众号（标题 SemiBold 600） =="
fi

# 平台后缀（文件名区分，防止两平台互相覆盖）
PLAT_TAG="gzh"
if [ "$PLATFORM" = "小红书" ]; then PLAT_TAG="xhs"; fi

# 2026-08-16：输出文件名加风格后缀，避免多风格输出互相覆盖
#   5 风格同时存在时，按风格英文名区分（陶土橙=terracotta/深黑=inkblack/暖灰=warmgray/鼠尾草绿=sage/雾霾蓝=mistblue）
PENTAG=""
case "$PALETTE" in
  陶土橙|terracotta) PENTAG="terracotta";;
  深黑|inkblack) PENTAG="inkblack";;
  暖灰|warmgray) PENTAG="warmgray";;
  鼠尾草绿|sage) PENTAG="sage";;
  雾霾蓝|mistblue) PENTAG="mistblue";;
esac

# 2026-08-16 改造：分两轮渲染
#   轮 1：cover-* (2.35:1 公众号封面) 用 _palette.css 中的 wx paper
#   轮 2：card-*  (3:4 小红书卡)  把 _palette.css 中 paper-wx 改为 paper-xhs 后渲染

# 轮 1：渲染 cover-* （用 _palette.css 当前的 wx paper）
for name in cover-research cover-editorial cover-fieldnotes cover-system cover-statement; do
  url="$("$PYTHON" -c 'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve().as_uri())' "$RENDER/$name.html")"
  "$CHROME" --headless=new --disable-gpu --force-device-scale-factor=2 \
    --window-size=1050,450 --screenshot="$OUT/$name-$PENTAG-$PLAT_TAG-2100x900.png" "$url" 2>/dev/null
done

# 切换 _palette.css：wx paper → xhs paper（扫描目录实际 xhs 文件名，非简单字符串替换；仅底图模式需要）
if [ "$MODE" = "img" ] && [ -n "$PALETTE" ] && [ -f "$RENDER/_palette.css" ]; then
  XHS_PAPER=$(basename "$(ls "$SKILLS/$PALETTE/"paper-xhs-*.png 2>/dev/null | head -1)")
  if [ -n "$XHS_PAPER" ]; then
    "$PYTHON" -c "
import re, sys
p, xhs = sys.argv[1], sys.argv[2]
with open(p, encoding='utf-8') as f: s = f.read()
# 把 --paper: url(...) 中的文件名替换为实际的 xhs paper 文件名
s = re.sub(r'(--paper:\s*url\(\"[^\"]*/)([^/\"\)]+)(\"\))', r'\g<1>' + xhs + r'\g<3>', s)
with open(p, 'w', encoding='utf-8') as f: f.write(s)
" "$RENDER/_palette.css" "$XHS_PAPER"
    echo "  paper: wx → xhs ($XHS_PAPER)"
  else
    echo "  !! 未找到 xhs paper，card-* 沿用 wx paper"
  fi
fi

# 轮 2：渲染 card-* （用 xhs paper，3:4）
for f in "$RENDER"/*.html; do
  name=$(basename "$f" .html)
  case "$name" in cover-*) continue ;; esac
  url="$("$PYTHON" -c 'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve().as_uri())' "$RENDER/$name.html")"
  "$CHROME" --headless=new --disable-gpu --force-device-scale-factor=2 \
    --window-size=540,720 --screenshot="$OUT/$name-$PENTAG-$PLAT_TAG-1080x1440.png" "$url" 2>/dev/null
done

echo "== done =="
