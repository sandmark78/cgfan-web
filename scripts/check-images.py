#!/usr/bin/env python3
"""
检查所有提示词的图片是否存在
数据来源：本地 content/prompts/ 目录（Markdown 文件）
"""

import os
import re
import sys
from pathlib import Path

# 项目根目录
project_root = Path(__file__).parent.parent
prompts_dir = project_root / 'content' / 'prompts'
images_dir = project_root / 'public' / 'images' / 'prompts'

def extract_frontmatter(content: str) -> dict:
    """提取 Markdown frontmatter"""
    match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}
    
    fm_text = match.group(1)
    result = {}
    
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"\'')
            result[key] = val
    
    return result

def check_images():
    """检查所有提示词的图片文件是否存在"""
    missing = []
    total_images = 0
    total_prompts = 0
    
    # 遍历所有 markdown 文件
    for md_file in prompts_dir.rglob('*.md'):
        total_prompts += 1
        content = md_file.read_text(encoding='utf-8')
        fm = extract_frontmatter(content)
        
        slug = fm.get('slug', md_file.stem)
        cover = fm.get('cover', '')
        
        # 检查 cover
        if cover:
            total_images += 1
            filename = cover.split('/')[-1]
            filepath = images_dir / filename
            if not filepath.exists():
                missing.append({
                    'slug': slug,
                    'type': 'cover',
                    'path': cover,
                    'file': filename,
                    'md_file': str(md_file.relative_to(prompts_dir))
                })
    
    # 输出结果
    print(f"检查完成：")
    print(f"  提示词总数: {total_prompts}")
    print(f"  图片总数: {total_images}")
    print(f"  缺失图片: {len(missing)}")
    
    if missing:
        print(f"\n缺失列表:")
        for item in missing:
            print(f"  [{item['type']}] {item['slug']}")
            print(f"    文件: {item['file']}")
            print(f"    来源: {item['md_file']}")
        return 1
    else:
        print("\n✓ 所有图片文件都存在")
        return 0

if __name__ == '__main__':
    sys.exit(check_images())
