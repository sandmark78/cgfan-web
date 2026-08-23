#!/usr/bin/env python3
"""
修复重复 tags 字段的 YAML 文件
"""
import re
from pathlib import Path

def fix_duplicate_tags(filepath: Path) -> bool:
    """删除重复的 tags 字段"""
    content = filepath.read_text()
    
    # 查找所有 tags: 出现的位置（包括行内数组和块格式）
    tags_pattern = r'^tags:'
    matches = list(re.finditer(tags_pattern, content, re.MULTILINE))
    
    if len(matches) <= 1:
        return False  # 没有重复
    
    # 保留第一个 tags，删除第二个及之后的
    # 从第二个 tags: 开始，找到它的内容范围
    second_tags_start = matches[1].start()
    
    # 找到第二个 tags 块的结束位置
    lines_after = content[second_tags_start:].split('\n')
    end_offset = 0
    for i, line in enumerate(lines_after):
        if i == 0:
            continue
        # 如果是 - 开头的行，继续
        if line.strip().startswith('-'):
            continue
        # 否则结束
        end_offset = sum(len(lines_after[j]) + 1 for j in range(i))
        break
    else:
        # 如果整个文件剩余都是 tags 内容
        end_offset = len(content) - second_tags_start
    
    # 删除第二个 tags 块
    new_content = content[:second_tags_start] + content[second_tags_start + end_offset:]
    
    # 清理可能的多余空行
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)
    
    if new_content != content:
        filepath.write_text(new_content)
        return True
    return False

def main():
    fixed = 0
    
    # 检查所有 markdown 文件
    for md_file in sorted(Path('content/prompts').rglob('*.md')):
        try:
            if fix_duplicate_tags(md_file):
                fixed += 1
                print(f'✅ 修复: {md_file}')
        except Exception as e:
            print(f'❌ 错误: {md_file} - {e}')
    
    print(f'\n{"="*60}')
    print(f'总计修复: {fixed} 个文件')
    
    if fixed > 0:
        print(f'\n下一步：')
        print(f'  npm run prebuild')
        print(f'  git add -A && git commit -m "fix: 修复重复 tags 字段" && git push')

if __name__ == '__main__':
    main()
