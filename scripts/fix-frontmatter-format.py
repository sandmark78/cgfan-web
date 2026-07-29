#!/usr/bin/env python3
"""
修复 frontmatter 格式错误的 markdown 文件
"""
import os
import re
from pathlib import Path

def fix_frontmatter(content):
    """修复 frontmatter 格式"""
    # 检查是否有 frontmatter
    if not content.startswith('---\n'):
        return content
    
    # 找到 frontmatter 结束位置
    end_match = re.search(r'\n---\n', content[4:])
    if not end_match:
        return content
    
    frontmatter_end = end_match.start() + 4
    frontmatter = content[4:frontmatter_end]
    rest = content[frontmatter_end+4:]
    
    # 检查 title 字段是否有多行内容混入
    lines = frontmatter.split('\n')
    fixed_lines = []
    in_title = False
    title_fixed = False
    
    for i, line in enumerate(lines):
        if line.startswith('title:'):
            # 检查 title 值是否被引号包围
            title_match = re.match(r'title:\s*["\']?(.+?)["\']?\s*$', line)
            if title_match:
                title_value = title_match.group(1)
                # 如果 title 值包含换行符或特殊字符，需要清理
                if '\n' in title_value or len(title_value) > 100:
                    # 取第一行作为 title
                    first_line = title_value.split('\n')[0].strip()
                    fixed_lines.append(f'title: "{first_line}"')
                    in_title = True
                    title_fixed = True
                else:
                    fixed_lines.append(f'title: "{title_value}"')
                    title_fixed = True
            else:
                fixed_lines.append(line)
        elif in_title and not title_fixed:
            # 跳过 title 后续的多行内容
            continue
        else:
            fixed_lines.append(line)
    
    # 重建 frontmatter
    fixed_frontmatter = '\n'.join(fixed_lines)
    
    # 确保所有必需字段存在
    required_fields = ['title', 'slug', 'model', 'category', 'tags', 'difficulty', 'cover', 'date', 'added', 'source', 'sourceLink', 'author']
    
    for field in required_fields:
        if f'{field}:' not in fixed_frontmatter:
            if field == 'tags':
                fixed_frontmatter += f'\n{field}:\n  - AI绘图\n  - 提示词'
            elif field == 'difficulty':
                fixed_frontmatter += f'\n{field}: intermediate'
            elif field == 'date':
                fixed_frontmatter += f'\n{field}: \'2026-07-29\''
            elif field == 'added':
                fixed_frontmatter += f'\n{field}: 2026-07-29T12:00:00+08:00'
            else:
                fixed_frontmatter += f'\n{field}: ""'
    
    return f'---\n{fixed_frontmatter}\n---\n{rest}'

def main():
    prompts_dir = Path('content/prompts')
    
    # 查找所有 markdown 文件
    md_files = list(prompts_dir.rglob('*.md'))
    
    fixed_count = 0
    for md_file in md_files:
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否需要修复
        if 'error: page.evaluate' in content or '碉堡了家人们' in content:
            # 移除错误信息
            content = re.sub(r'error: page\.evaluate:.*?\n', '', content)
            content = re.sub(r'evaluate@debugger.*?\n', '', content)
            content = re.sub(r'@debugger eval.*?\n', '', content)
            content = re.sub(r'errorType:.*?\n', '', content)
            
            # 修复 frontmatter
            content = fix_frontmatter(content)
            
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f'✅ Fixed: {md_file}')
            fixed_count += 1
    
    print(f'\n📊 共修复 {fixed_count} 个文件')

if __name__ == '__main__':
    main()
