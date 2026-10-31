#!/usr/bin/env python3
"""检查最近7天的数据问题"""

from pathlib import Path
import re
import time

prompts_dir = Path('content/prompts')
recent_files = []

for md_file in prompts_dir.rglob('*.md'):
    mtime = md_file.stat().st_mtime
    if time.time() - mtime < 7 * 24 * 3600:
        recent_files.append(md_file)

print(f"最近7天的文件: {len(recent_files)} 个")

# 检查标题和cover问题
short_titles = []
empty_covers = []

for md_file in recent_files:
    content = md_file.read_text(encoding='utf-8')
    
    # 提取标题
    title_match = re.search(r'^title:\s*"([^"]+)"', content, re.MULTILINE)
    if title_match:
        title = title_match.group(1)
        if len(title) <= 8:
            short_titles.append((md_file, title, len(title)))
    
    # 检查cover
    if 'cover: ""' in content:
        empty_covers.append(md_file)

print(f"\n标题过短（≤8字）: {len(short_titles)} 个")
for f, t, l in sorted(short_titles, key=lambda x: x[2])[:20]:
    print(f"  [{l}字] {f.name}: {t}")

print(f"\n封面为空: {len(empty_covers)} 个")
for f in empty_covers[:10]:
    print(f"  {f.name}")

# 输出需要修复的文件列表
if short_titles:
    print("\n=== 需要修复标题的文件 ===")
    for f, t, l in short_titles:
        print(f.name)

if empty_covers:
    print("\n=== 需要修复封面的文件 ===")
    for f in empty_covers:
        print(f.name)
