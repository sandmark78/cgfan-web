#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理 markdown 文件中的占位符标签
"""

import os
import re
import yaml
from pathlib import Path
from typing import List

# 需要移除的占位符标签
PLACEHOLDER_TAGS = ['待处理', 'todo', 'placeholder', 'TODO', '待整理']

def clean_tags(tags: List[str]) -> List[str]:
    """清理标签列表，移除占位符"""
    if not isinstance(tags, list):
        return []
    
    cleaned = [tag for tag in tags if tag not in PLACEHOLDER_TAGS]
    return cleaned if cleaned else ['未分类']

def process_markdown_file(file_path: Path) -> bool:
    """处理单个 markdown 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 分离 frontmatter 和正文
        if not content.startswith('---'):
            return False
        
        parts = content.split('---', 2)
        if len(parts) < 3:
            return False
        
        frontmatter_str = parts[1]
        body = parts[2]
        
        # 解析 frontmatter
        frontmatter = yaml.safe_load(frontmatter_str)
        if not frontmatter:
            return False
        
        # 获取原始标签
        original_tags = frontmatter.get('tags', [])
        
        # 清理标签
        cleaned_tags = clean_tags(original_tags)
        
        # 如果标签没有变化，跳过
        if original_tags == cleaned_tags:
            return False
        
        # 更新 frontmatter
        frontmatter['tags'] = cleaned_tags
        
        # 重新生成文件
        new_frontmatter = yaml.dump(frontmatter, allow_unicode=True, sort_keys=False, default_flow_style=False)
        new_content = f'---\n{new_frontmatter}---{body}'
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    except Exception as e:
        print(f"❌ 处理失败 {file_path.name}: {e}")
        return False

def main():
    """主函数"""
    content_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')
    
    updated_count = 0
    total_count = 0
    
    # 遍历所有 markdown 文件
    for md_file in content_dir.rglob('*.md'):
        total_count += 1
        if process_markdown_file(md_file):
            updated_count += 1
            print(f"✅ 更新: {md_file.name}")
    
    print(f"\n{'='*60}")
    print(f"✅ 清理完成！")
    print(f"{'='*60}")
    print(f"📊 总计: {total_count} 个文件")
    print(f"📝 更新: {updated_count} 个文件")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
