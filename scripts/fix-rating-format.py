#!/usr/bin/env python3
"""
修复 markdown 评分格式：扁平字段 → 嵌套 rating 对象
"""
import re
from pathlib import Path

def fix_file(filepath: Path):
    content = filepath.read_text(encoding='utf-8')
    
    # 提取扁平评分字段
    fields = ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']
    values = {}
    
    for field in fields:
        match = re.search(rf'^{field}:\s*(\d+)', content, re.MULTILINE)
        if match:
            values[field] = int(match.group(1))
    
    if not values:
        return False
    
    # 删除扁平字段
    for field in fields:
        content = re.sub(rf'^{field}:\s*\d+\s*\n', '', content, flags=re.MULTILINE)
    
    # 构建嵌套 rating 对象
    rating_block = "rating:\n"
    for field in fields:
        if field in values:
            rating_block += f"  {field}: {values[field]}\n"
    
    # 在 score: 后面插入 rating
    content = re.sub(r'(score:\s*\d+\s*\n)', rf'\1{rating_block}', content)
    
    filepath.write_text(content, encoding='utf-8')
    return True

def main():
    today_dir = Path('content/prompts/2026/09/17')
    files = list(today_dir.glob('*.md'))
    
    fixed = 0
    for f in files:
        if fix_file(f):
            print(f'✅ {f.name}')
            fixed += 1
        else:
            print(f'⏭️  {f.name} (无需修复)')
    
    print(f'\n完成: {fixed}/{len(files)} 个文件已修复')

if __name__ == '__main__':
    main()
