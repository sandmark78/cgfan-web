#!/usr/bin/env python3
"""修复重复 tags 字段的 markdown 文件"""
import re
from pathlib import Path

def fix_duplicate_tags(file_path: Path):
    """修复单个文件的重复 tags"""
    content = file_path.read_text(encoding='utf-8')
    
    # 查找所有 tags 字段
    lines = content.split('\n')
    tags_lines = []
    for i, line in enumerate(lines):
        if line.startswith('tags:'):
            tags_lines.append(i)
    
    if len(tags_lines) <= 1:
        return False  # 没有重复
    
    # 保留第二个 tags 字段，删除第一个
    first_tags_idx = tags_lines[0]
    
    # 检查第一个 tags 是否是多行格式
    if first_tags_idx + 1 < len(lines) and lines[first_tags_idx + 1].strip().startswith('-'):
        # 多行格式，需要删除整个列表
        delete_end = first_tags_idx + 1
        while delete_end < len(lines) and lines[delete_end].strip().startswith('-'):
            delete_end += 1
        del lines[first_tags_idx:delete_end]
    else:
        # 单行格式
        del lines[first_tags_idx]
    
    # 写回文件
    file_path.write_text('\n'.join(lines), encoding='utf-8')
    return True

def main():
    prompts_dir = Path('content/prompts')
    fixed_count = 0
    
    for md_file in prompts_dir.glob('**/*.md'):
        if fix_duplicate_tags(md_file):
            print(f'✓ 修复: {md_file}')
            fixed_count += 1
    
    print(f'\n共修复 {fixed_count} 个文件')

if __name__ == '__main__':
    main()
