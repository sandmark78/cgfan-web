#!/usr/bin/env python3
"""清理孤儿图片：删除 public/images/prompts/ 中未被任何 markdown 引用的图片"""

import re
from pathlib import Path

# 找出所有 markdown 中引用的图片
referenced = set()
for md in Path('content/prompts').rglob('*.md'):
    with open(md) as f:
        content = f.read()
    for match in re.finditer(r'/images/prompts/prompt-[\w-]+\.jpg', content):
        referenced.add(match.group(0).split('/')[-1])

# 扫描所有 jpg
img_dir = Path('public/images/prompts')
all_imgs = {f.name for f in img_dir.glob('*.jpg')}

# 孤儿
orphans = sorted(all_imgs - referenced)
print(f"引用图片: {len(referenced)}")
print(f"总图片: {len(all_imgs)}")
print(f"孤儿: {len(orphans)}")

if not orphans:
    print("✅ 无孤儿图片")
else:
    # 计算大小
    total_size = sum((img_dir / f).stat().st_size for f in orphans)
    print(f"孤儿大小: {total_size / 1024 / 1024:.1f} MB")
    
    # 删除
    for f in orphans:
        (img_dir / f).unlink()
    
    print(f"✅ 已删除 {len(orphans)} 张孤儿图片")
