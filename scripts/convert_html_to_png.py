"""
Convert HTML infographics to PNG screenshots.

Usage:
    1. Set HTML_DIR and configure FILE_LIST
    2. Run: python convert_html_to_png.py
    3. Requires html2image: pip install html2image
"""

import os
from html2image import Html2Image

# ── Configuration ──────────────────────────────────────────────────
HTML_DIR = "path/to/your/html_infographics"
OUTPUT_DIR = HTML_DIR

# Format: "filename.html": (width, height)
FILE_LIST = {
    # "01-xxx.html": (680, 720),
    # "02-xxx.html": (680, 520),
}
# ───────────────────────────────────────────────────────────────────

hti = Html2Image(browser="edge")
hti.output_path = OUTPUT_DIR

for html_file, size in FILE_LIST.items():
    html_path = os.path.join(HTML_DIR, html_file)
    png_name = html_file.replace(".html", ".png")
    print(f"Converting {html_file} -> {png_name} ({size[0]}x{size[1]})")
    try:
        hti.screenshot(html_file=[html_path], save_as=png_name, size=size)
        print(f"  OK")
    except Exception as e:
        print(f"  FAIL: {e}")

print("All conversions done!")
