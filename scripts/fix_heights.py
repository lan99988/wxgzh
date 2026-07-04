"""
Fix cutoff issues in HTML-to-PNG conversions.

Re-renders HTML infographics with adjusted heights when content
overflows the bottom of the screenshot.

Usage:
    1. Configure FIX_FILES and HTML_DIR
    2. Run: python fix_heights.py
"""

import os
from html2image import Html2Image

# ── Configuration ──────────────────────────────────────────────────
HTML_DIR = "path/to/your/html_files"
OUTPUT_DIR = HTML_DIR

# Files to fix: html_filename -> (new_width, new_height)
FIX_FILES = {
    # "04-xxx.html": (680, 1000),
    # "08-xxx.html": (680, 620),
}
# ───────────────────────────────────────────────────────────────────

hti = Html2Image(browser="edge")
hti.output_path = OUTPUT_DIR

for html_file, size in FIX_FILES.items():
    html_path = os.path.join(HTML_DIR, html_file)
    png_name = html_file.replace(".html", ".png")
    print(f"Fixing {html_file} -> {png_name} ({size[0]}x{size[1]})")
    try:
        hti.screenshot(html_file=[html_path], save_as=png_name, size=size)
        print(f"  OK")
    except Exception as e:
        print(f"  FAIL: {e}")

print("All fixed!")
