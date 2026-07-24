#!/usr/bin/env python3
"""
检查提示词质量，找出低质量文件
"""

import os
import re
from pathlib import Path

prompts_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')

issues = []

for md_file in prompts_dir.rglob('*.md'):
    if 'manual' in str(md_file):
        continue
    
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取frontmatter
    fm_match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        continue
    
    frontmatter = fm_match.group(1)
    
    # 提取标题
    title_match = re.search(r'title:\s*["\']?(.+?)["\']?\s*$', frontmatter, re.MULTILINE)
    title = title_match.group(1) if title_match else '无标题'
    
    # 提取提示词内容
    prompt_match = re.search(r'^---\s*\n.*?\n---\s*\n(.*?)$', content, re.DOTALL)
    prompt_text = prompt_match.group(1).strip() if prompt_match else ''
    
    # 检查问题
    problems = []
    
    # 1. 提示词太短（<50字符）
    if len(prompt_text) < 50:
        problems.append(f'提示词过短({len(prompt_text)}字)')
    
    # 2. 标题质量差
    if len(title) < 3:
        problems.append('标题过短')
    if re.match(r'^untitled$', title, re.IGNORECASE):
        problems.append('未命名')
    if re.search(r'[🎨📸🎮👤📁📦🎯📷🎭🌃✨🙌🏴‍☠️🧐💎]', title):
        problems.append('标题含emoji')
    
    # 3. 检查是否有图片
    cover_match = re.search(r'cover:\s*(.+?)$', frontmatter, re.MULTILINE)
    if not cover_match:
        problems.append('无封面图')
    else:
        cover_path = cover_match.group(1).strip()
        # 检查图片文件是否存在
        img_file = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/public') / cover_path.lstrip('/')
        if not img_file.exists():
            problems.append(f'图片不存在: {cover_path}')
    
    # 4. 分类问题
    category_match = re.search(r'category:\s*["\']?(.+?)["\']?\s*$', frontmatter, re.MULTILINE)
    if not category_match:
        problems.append('无分类')
    
    # 5. 提示词内容检查
    if '分享' in title and '提示词' not in title:
        problems.append('标题含"分享"但非提示词')
    if '教程' in title:
        problems.append('教程类内容')
    if re.search(r'^\d+$', title.strip()):
        problems.append('纯数字标题')
    
    if problems:
        issues.append({
            'file': md_file.relative_to(prompts_dir),
            'title': title[:50],
            'problems': problems,
            'prompt_length': len(prompt_text)
        })

# 输出结果
print(f'发现 {len(issues)} 个有问题的文件：\n')

# 按问题严重程度排序
critical = [i for i in issues if any('过短' in p or '不存在' in p or '无封面' in p for p in i['problems'])]
moderate = [i for i in issues if i not in critical]

print(f'🔴 严重问题（建议删除）: {len(critical)} 个')
for item in critical[:20]:
    print(f"  {item['file']}")
    print(f"    标题: {item['title']}")
    print(f"    问题: {', '.join(item['problems'])}")
    print(f"    提示词长度: {item['prompt_length']}字")
    print()

print(f'\n🟡 中等问题（建议优化）: {len(moderate)} 个')
for item in moderate[:10]:
    print(f"  {item['file']}")
    print(f"    标题: {item['title']}")
    print(f"    问题: {', '.join(item['problems'])}")
    print()
