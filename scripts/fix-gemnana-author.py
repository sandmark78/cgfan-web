#!/usr/bin/env python3
"""
修复 gemnana 提示词的 author 字段
从 parsed.json 读取 source/source_link，更新到已上传的 markdown 文件
"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
GEMNANA_DATA = BASE_DIR / "gemnana-data"
PARSED_FILE = GEMNANA_DATA / "parsed.json"
PROMPTS_DIR = BASE_DIR / "content" / "prompts" / "gemnana"


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def fix_author():
    # 加载数据
    parsed = load_json(PARSED_FILE)
    
    # 建立 ID -> 数据映射
    data_map = {item['id']: item for item in parsed}
    
    fixed = 0
    skipped = 0
    
    # 遍历所有已上传的文件
    for md_file in PROMPTS_DIR.glob("gemnana-*.md"):
        # 提取 ID: gemnana-24.md -> 24
        item_id = md_file.stem.replace('gemnana-', '')
        
        if item_id not in data_map:
            skipped += 1
            continue
        
        item = data_map[item_id]
        author = item.get('source', '') or ''
        author_link = item.get('source_link', '') or ''
        
        # 读取文件内容
        content = md_file.read_text(encoding='utf-8')
        
        # 检查是否已有 author 字段
        if 'author:' in content:
            skipped += 1
            continue
        
        # 在 source: 行后插入 author 和 authorLink
        # 找到 source: 行
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            new_lines.append(line)
            if line.startswith('source:'):
                # 插入 author 和 authorLink
                new_lines.append(f'author: "{author}"')
                new_lines.append(f'authorLink: "{author_link}"')
        
        # 写回文件
        new_content = '\n'.join(new_lines)
        md_file.write_text(new_content, encoding='utf-8')
        fixed += 1
    
    print(f"✅ 修复完成: {fixed} 条")
    print(f"⏭️  跳过: {skipped} 条（已有 author 或无数据）")


if __name__ == "__main__":
    fix_author()
