#!/usr/bin/env python3
"""
清理低质条目：
1. 标题过长（>60字）
2. 含emoji标题
3. 低质标题词
"""

import os
import re
from pathlib import Path

prompts_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')

# 低质特征
low_quality_patterns = [
    (r'[🎨📸🎮👤📁📦🎯📷🎭🌃]', '含emoji'),
    (r'^(分享|教程|技巧|GPT🍃|最近总刷到)', '低质标题词'),
]

# 清理记录
cleanup_log = []

for md_file in prompts_dir.rglob('*.md'):
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取标题
    title_match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    if not title_match:
        continue
    
    title = title_match.group(1)
    issues = []
    
    # 检查问题
    for pattern, desc in low_quality_patterns:
        if re.search(pattern, title):
            issues.append(desc)
    
    # 标题过长
    if len(title) > 60:
        issues.append(f'标题过长({len(title)}字)')
    
    if issues:
        cleanup_log.append({
            'file': md_file,
            'title': title,
            'issues': issues
        })

print(f'发现 {len(cleanup_log)} 个低质条目：\n')
for item in cleanup_log:
    print(f"文件: {item['file'].relative_to(prompts_dir)}")
    print(f"标题: {item['title'][:60]}...")
    print(f"问题: {', '.join(item['issues'])}")
    print()
