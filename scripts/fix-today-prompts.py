#!/usr/bin/env python3
"""
修复 2026-08-26 采集的 markdown 文件
1. 删除重复 tags 字段（保留第一个）
2. 填充 source 字段（从 slug 提取 tweet_id）
3. 填充 authorLink 字段（从原始数据读取）
"""
import re
import json
from pathlib import Path

CONTENT_DIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts/2026/08/26")
PREPROCESSED = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/data/auto-collect/preprocessed.json")

# 读取预处理数据，构建 tweet_id -> {source, authorLink} 映射
with open(PREPROCESSED, 'r', encoding='utf-8') as f:
    preprocessed = json.load(f)

tweet_map = {}
for item in preprocessed:
    tweet_id = item.get('tweet_id', '')
    source = item.get('source', '')
    author_link = item.get('authorLink', '')
    if tweet_id:
        tweet_map[tweet_id] = {
            'source': source,
            'authorLink': author_link
        }

fixed_count = 0

for md_file in CONTENT_DIR.glob("prompt-*.md"):
    content = md_file.read_text(encoding='utf-8')
    original_content = content
    
    # 提取 slug
    slug_match = re.search(r'slug:\s*["\']?([^"\'\n]+)["\']?', content)
    if not slug_match:
        continue
    slug = slug_match.group(1).strip()
    
    # 从 slug 提取 tweet_id
    tweet_id = slug.replace('prompt-', '')
    
    # 获取正确的 source 和 authorLink
    correct_data = tweet_map.get(tweet_id, {})
    correct_source = correct_data.get('source', '')
    correct_author_link = correct_data.get('authorLink', '')
    
    # 1. 删除重复 tags 字段（保留第一个）
    lines = content.split('\n')
    new_lines = []
    tags_found = False
    for line in lines:
        if line.startswith('tags:'):
            if not tags_found:
                new_lines.append(line)
                tags_found = True
            # 否则跳过（删除重复的 tags）
        else:
            new_lines.append(line)
    content = '\n'.join(new_lines)
    
    # 2. 填充 source 字段
    if correct_source:
        content = re.sub(
            r'source:\s*""',
            f'source: "{correct_source}"',
            content
        )
        content = re.sub(
            r'source:\s*$',
            f'source: "{correct_source}"',
            content,
            flags=re.MULTILINE
        )
    
    # 3. 填充 authorLink 字段
    if correct_author_link:
        content = re.sub(
            r'authorLink:\s*""',
            f'authorLink: "{correct_author_link}"',
            content
        )
        content = re.sub(
            r'authorLink:\s*$',
            f'authorLink: "{correct_author_link}"',
            content,
            flags=re.MULTILINE
        )
    
    # 写回文件
    if content != original_content:
        md_file.write_text(content, encoding='utf-8')
        fixed_count += 1
        print(f"✅ 修复: {md_file.name}")

print(f"\n**修复完成**: {fixed_count} 个文件")
