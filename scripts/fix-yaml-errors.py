#!/usr/bin/env python3
"""
修复 markdown 文件的 YAML 格式错误
1. 删除重复的 tags 字段（保留第一个）
2. 删除 composition/color 等字段前的多余字符
"""
import re
from pathlib import Path

def fix_file(filepath: Path) -> bool:
    content = filepath.read_text(encoding='utf-8')
    
    # 提取 frontmatter
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False
    
    fm_text = match.group(1)
    original_fm = fm_text
    
    # 1. 修复重复 tags：找到所有 tags: 行，保留第一个
    # 先找所有 tags: 出现的位置
    tags_positions = []
    for m in re.finditer(r'^tags:\s*.*$', fm_text, re.MULTILINE):
        tags_positions.append(m)
    
    if len(tags_positions) > 1:
        # 保留第一个 tags，删除后续的
        # 从后往前删除，避免位置偏移
        for m in reversed(tags_positions[1:]):
            # 删除这一行（包括后面的换行）
            start = m.start()
            end = m.end()
            if end < len(fm_text) and fm_text[end] == '\n':
                end += 1
            fm_text = fm_text[:start] + fm_text[end:]
    
    # 2. 修复多余字符：删除单独一行的 u 或 t（在 composition 之前）
    fm_text = re.sub(r'\n[ut]\n(?=composition:)', '\n', fm_text)
    
    if fm_text != original_fm:
        new_content = f'---\n{fm_text}\n---' + content[match.end():]
        filepath.write_text(new_content, encoding='utf-8')
        return True
    return False

def main():
    content_dir = Path('content/prompts')
    fixed = 0
    total = 0
    
    for md_file in content_dir.rglob('*.md'):
        total += 1
        if fix_file(md_file):
            print(f'✅ {md_file}')
            fixed += 1
    
    print(f'\n完成: {fixed}/{total} 个文件已修复')

if __name__ == '__main__':
    main()
