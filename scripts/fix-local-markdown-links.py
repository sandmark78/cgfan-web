#!/usr/bin/env python3
"""
修复本地 markdown 文件缺失的 source_link 和 author_link 字段
从 source 字段提取信息并补充
"""

import re
from pathlib import Path

def extract_username_from_url(url):
    """从 URL 提取用户名"""
    if not url:
        return None
    
    # 匹配 x.com/username 或 twitter.com/username
    match = re.search(r'(?:x\.com|twitter\.com)/([^/]+)', url)
    if match:
        username = match.group(1)
        # 排除一些非用户名的路径
        if username not in ['i', 'intent', 'search', 'hashtag', 'status']:
            return username
    return None

def fix_markdown_file(md_file):
    """修复单个 markdown 文件"""
    content = md_file.read_text(encoding='utf-8')
    
    # 提取 frontmatter
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        return False, 'no_frontmatter'
    
    fm_text = fm_match.group(1)
    
    # 提取字段
    source_match = re.search(r'^source:\s*(.+)$', fm_text, re.MULTILINE)
    source_link_match = re.search(r'^source_link:\s*(.+)$', fm_text, re.MULTILINE)
    author_link_match = re.search(r'^author_link:\s*(.+)$', fm_text, re.MULTILINE)
    
    source = source_match.group(1).strip().strip('"') if source_match else ''
    source_link = source_link_match.group(1).strip().strip('"') if source_link_match else ''
    author_link = author_link_match.group(1).strip().strip('"') if author_link_match else ''
    
    updates = []
    
    # 修复 source_link
    if not source_link and source:
        # 如果 source 是 x.com 链接，直接用作 source_link
        if 'x.com' in source or 'twitter.com' in source:
            source_link = source
            updates.append(f'source_link: "{source_link}"')
        # 如果 source 是 @username 格式，转换为链接
        elif source.startswith('@'):
            username = source[1:]
            source_link = f'https://x.com/{username}'
            updates.append(f'source_link: "{source_link}"')
    
    # 修复 author_link
    if not author_link:
        # 从 source_link 提取用户名
        if source_link:
            username = extract_username_from_url(source_link)
            if username:
                author_link = f'https://x.com/{username}'
                updates.append(f'author_link: "{author_link}"')
    
    if not updates:
        return False, 'no_updates'
    
    # 插入新字段到 frontmatter
    new_fm_text = fm_text
    for update in updates:
        new_fm_text += f'\n{update}'
    
    new_content = content.replace(fm_text, new_fm_text)
    md_file.write_text(new_content, encoding='utf-8')
    
    return True, 'fixed'

def main():
    content_dir = Path('content/prompts')
    md_files = list(content_dir.rglob('*.md'))
    
    print(f"📁 扫描本地 markdown 文件: {len(md_files)} 个\n")
    
    fixed = 0
    skipped = 0
    
    for md_file in md_files:
        success, reason = fix_markdown_file(md_file)
        if success:
            fixed += 1
        else:
            skipped += 1
    
    print(f"\n✅ 修复完成")
    print(f"  已修复: {fixed} 个")
    print(f"  跳过: {skipped} 个")

if __name__ == '__main__':
    main()
