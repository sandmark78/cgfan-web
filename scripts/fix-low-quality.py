#!/usr/bin/env python3
"""
修复低质条目：
1. 移除emoji
2. 截断过长标题
3. 清理低质标题词
"""

import os
import re
from pathlib import Path

prompts_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')

# 修复记录
fixed_count = 0

for md_file in prompts_dir.rglob('*.md'):
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取标题
    title_match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    if not title_match:
        continue
    
    title = title_match.group(1)
    original_title = title
    modified = False
    
    # 1. 移除emoji
    emoji_pattern = r'[🎨📸🎮👤📁📦🎯📷🎭🌃✨🙌🏴‍☠️🧐💎]'
    if re.search(emoji_pattern, title):
        title = re.sub(emoji_pattern, '', title).strip()
        modified = True
    
    # 2. 清理低质标题词
    low_quality_words = ['分享', '教程', '技巧', 'GPT🍃', '最近总刷到']
    for word in low_quality_words:
        if title.startswith(word):
            # 尝试提取更有意义的标题
            if '提示词' in title:
                # 从提示词内容提取主题
                prompt_match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
                if prompt_match:
                    frontmatter = prompt_match.group(1)
                    # 尝试从tags或category提取
                    tags_match = re.search(r'tags:\s*\[(.*?)\]', frontmatter)
                    if tags_match:
                        tags = tags_match.group(1).split(',')
                        if tags:
                            title = tags[0].strip().strip('"\'')
                            modified = True
                            break
            break
    
    # 3. 截断过长标题（保留前50字）
    if len(title) > 60:
        title = title[:50].rstrip() + '...'
        modified = True
    
    # 如果修改了，更新文件
    if modified and title != original_title:
        # 替换标题
        new_content = re.sub(
            r'^(title:\s*["\']?)(.+?)(["\']?\s*)$',
            lambda m: f'{m.group(1)}{title}{m.group(3)}',
            content,
            flags=re.MULTILINE
        )
        
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        fixed_count += 1
        print(f'✓ 修复: {md_file.name}')
        print(f'  原标题: {original_title[:60]}...')
        print(f'  新标题: {title[:60]}...')
        print()

print(f'\n完成！修复了 {fixed_count} 个文件')
