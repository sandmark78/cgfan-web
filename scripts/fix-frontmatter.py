#!/usr/bin/env python3
"""
修复重命名导致的 frontmatter 问题（双 --- 开头）
"""
import re
from pathlib import Path

prompts_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')
fixed = 0

for md_file in prompts_dir.rglob('*.md'):
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否以 ---\n--- 开头（双 --- 问题）
    if content.startswith('---\n---'):
        # 去掉第一个 --- 和换行
        content = content[4:]  # 去掉 '---\n---' 的前4个字符（'---'）
        # 实际上要去掉的是 '---\n' 即第一个 --- 和后面的换行
        content = content[4:]  # 去掉 '---\n'
        
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        fixed += 1
        if fixed <= 5:
            print(f'✓ 修复: {md_file.relative_to(prompts_dir)}')

print(f'\n修复完成！共修复 {fixed} 个文件')