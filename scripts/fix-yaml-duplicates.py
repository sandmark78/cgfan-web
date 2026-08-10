#!/usr/bin/env python3
"""
修复YAML重复字段问题

扫描 content/prompts/ 下所有 .md 文件，修复重复的 frontmatter 字段
"""

import re
from pathlib import Path

def fix_yaml_duplicates(filepath: Path) -> bool:
    """修复单个文件的YAML重复字段"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查是否有 frontmatter
        if not content.startswith('---'):
            return False
        
        # 提取 frontmatter
        match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not match:
            return False
        
        frontmatter = match.group(1)
        lines = frontmatter.split('\n')
        
        # 检查是否有重复的 tags 字段
        tags_line_indices = []
        for i, line in enumerate(lines):
            if re.match(r'^tags:', line):
                tags_line_indices.append(i)
        
        if len(tags_line_indices) <= 1:
            return False  # 没有重复
        
        # 保留第一个 tags，删除后续的
        # 第一个 tags 可能是数组格式或列表格式
        first_tags_idx = tags_line_indices[0]
        first_tags_line = lines[first_tags_idx]
        
        # 判断第一个 tags 的格式
        if '[' in first_tags_line:
            # 数组格式，保留它
            keep_first = True
        else:
            # 列表格式，转换为数组格式
            # 收集所有列表项
            tags_values = []
            j = first_tags_idx + 1
            while j < len(lines) and (lines[j].startswith('- ') or lines[j].startswith('  - ')):
                val = lines[j].strip().lstrip('- ').strip()
                tags_values.append(val)
                j += 1
            # 转换为数组格式
            lines[first_tags_idx] = f'tags: {tags_values}'
            # 删除列表项行
            del lines[first_tags_idx+1:j]
            # 更新后续的索引
            tags_line_indices = [i for i in tags_line_indices if i >= j or i == first_tags_idx]
            keep_first = True
        
        # 删除后续的 tags 字段及其列表项
        new_lines = []
        skip = False
        for i, line in enumerate(lines):
            if i in tags_line_indices[1:]:
                # 这是后续的 tags 行，跳过
                skip = True
                continue
            elif skip:
                # 检查是否是列表项或下一个字段
                if line.startswith('- ') or line.startswith('  - '):
                    continue  # 跳过列表项
                else:
                    skip = False  # 遇到新字段，停止跳过
            
            new_lines.append(line)
        
        new_frontmatter = '\n'.join(new_lines)
        new_content = content[:match.start(1)] + new_frontmatter + content[match.end(1):]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    except Exception as e:
        print(f"❌ 修复失败 {filepath}: {e}")
        return False

def main():
    prompts_dir = Path("content/prompts")
    fixed_count = 0
    
    print("🔧 扫描并修复 YAML 重复字段...")
    
    for md_file in prompts_dir.rglob("*.md"):
        if fix_yaml_duplicates(md_file):
            fixed_count += 1
            print(f"✅ 修复: {md_file}")
    
    print(f"\n{'='*60}")
    print(f"✅ 完成！修复了 {fixed_count} 个文件")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
