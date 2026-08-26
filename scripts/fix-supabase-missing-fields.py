#!/usr/bin/env python3
"""
直接更新 Supabase 中缺失字段的记录
"""
import json
import re
import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from supabase_utils import get_client

def extract_from_markdown(file_path):
    """从 markdown 文件提取 frontmatter 数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取 frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None
    
    frontmatter = match.group(1)
    data = {}
    
    # 提取关键字段
    for line in frontmatter.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            data[key] = value
    
    return data

def main():
    client = get_client()
    
    # 1. 查询所有缺失字段的记录
    print("🔍 查询 Supabase 中缺失字段的记录...")
    
    # 查询 author_link 为空的记录
    response = client.table('prompts').select('slug,title').is_('author_link', 'null').execute()
    missing_author = response.data if hasattr(response, 'data') else []
    
    # 查询 source_link 为空的记录
    response = client.table('prompts').select('slug,title').is_('source_link', 'null').execute()
    missing_source = response.data if hasattr(response, 'data') else []
    
    # 合并去重
    missing_slugs = set()
    for r in missing_author:
        missing_slugs.add(r['slug'])
    for r in missing_source:
        missing_slugs.add(r['slug'])
    
    print(f"⚠️  缺失字段的记录: {len(missing_slugs)} 条")
    
    if not missing_slugs:
        print("✅ 没有缺失字段的记录")
        return
    
    # 2. 从本地 markdown 文件读取正确的数据
    print("\n📖 从本地 markdown 文件读取数据...")
    updates = []
    
    content_dir = project_root / 'content' / 'prompts'
    for md_file in content_dir.rglob('*.md'):
        data = extract_from_markdown(md_file)
        if not data or 'slug' not in data:
            continue
        
        slug = data['slug']
        if slug not in missing_slugs:
            continue
        
        update_data = {'slug': slug}
        if data.get('authorLink'):
            update_data['author_link'] = data['authorLink']
        if data.get('source'):
            update_data['source_link'] = data['source']
        
        if len(update_data) > 1:  # 除了 slug 还有其他字段
            updates.append(update_data)
            print(f"  ✓ {slug}: author_link={update_data.get('author_link', 'N/A')}, source_link={update_data.get('source_link', 'N/A')}")
    
    print(f"\n📝 准备更新 {len(updates)} 条记录")
    
    # 3. 逐条更新
    print("\n🔄 开始更新 Supabase...")
    success_count = 0
    fail_count = 0
    
    for update in updates:
        slug = update['slug']
        response = client.table('prompts').update(update).eq('slug', slug).execute()
        
        if hasattr(response, 'data') and response.data:
            print(f"  ✅ {slug}")
            success_count += 1
        else:
            print(f"  ❌ {slug}: 更新失败")
            fail_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ 更新完成: {success_count} 条成功, {fail_count} 条失败")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
