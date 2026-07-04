"""
Insert image references into a Markdown article at marked positions.

Usage:
    1. Set SOURCE_FILE and DEST_FILE
    2. Configure the insertions list with (line_number, search_text, image_markdown)
    3. Run: python insert_images.py
"""

import re

# ── Configuration ──────────────────────────────────────────────────
SOURCE_FILE = "path/to/your/article.md"          # Original markdown file
DEST_FILE = "path/to/your/article_with_images.md"  # Output file with images inserted

# Format: (line_number, search_text, image_markdown_line)
insertions = [
    # Example:
    # (30, '设计 → 晶圆制造', '![产业链地图](imgs/01-xxx.png)\n'),
    # (113, '低', '![价值密度矩阵](imgs/02-xxx.png)\n'),
]
# ───────────────────────────────────────────────────────────────────

with open(SOURCE_FILE, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Sort by line number descending to avoid offset issues
insertions.sort(key=lambda x: x[0], reverse=True)

for line_num, search_text, insert_text in insertions:
    if search_text in lines[line_num - 1]:
        # Insert after the target line
        lines.insert(line_num, insert_text)
        print(f"Inserted after line {line_num}: [{search_text}]")
    else:
        # Fallback: find by text content
        found = False
        for i, line in enumerate(lines):
            if search_text.lower() in line.lower():
                lines.insert(i + 1, insert_text)
                print(f"Inserted after line {i+1} (matched text): [{search_text}]")
                found = True
                break
        if not found:
            print(f"WARNING: Could not find '{search_text}' in file")

with open(DEST_FILE, "w", encoding="utf-8") as f:
    f.writelines(lines)

print(f"\nDone! Output: {DEST_FILE}")
