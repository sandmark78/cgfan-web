#!/usr/bin/env python3
"""
更新 Supabase 中缺失 author_link 和 source_link 的记录（空字符串）
"""
import re
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from supabase_utils import get_client

def extract_from_markdown(file_path):
    """从 markdown 文件提取完整数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None
    
    frontmatter = match.group(1)
    data = {}
    
    for line in frontmatter.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            data[key] = value
    
    return data

def main():
    client = get_client()
    
    # 1. 查询 author_link 或 source_link 为空字符串的记录
    print("🔍 查询 Supabase 中 author_link/source_link 为空的记录...")
    
    all_missing = set()
    
    # 用 REST API 方式查询空字符串
    response = client.table('prompts').select('slug').eq('author_link', '').execute()
    if hasattr(response, 'data'):
        for r in response.data:
            all_missing.add(r['slug'])
        print(f"  author_link 为空: {len(response.data)} 条")
    
    response = client.table('prompts').select('slug').eq('source_link', '').execute()
    if hasattr(response, 'data'):
        for r in response.data:
            all_missing.add(r['slug'])
        print(f"  source_link 为空: {len(response.data)} 条")
    
    print(f"✓ 共 {len(all_missing)} 条记录需要更新")
    
    if not all_missing:
        print("✅ 没有缺失字段的记录")
        return
    
    # 2. 读取本地 markdown 文件，匹配缺失的记录
    print("\n📖 读取本地 markdown 文件...")
    content_dir = project_root / 'content' / 'prompts'
    
    updates = []
    
    for md_file in content_dir.rglob('*.md'):
        data = extract_from_markdown(md_file)
        if not data or 'slug' not in data:
            continue
        
        slug = data['slug']
        if slug not in all_missing:
            continue
        
        updates.append({
            'slug': slug,
            'author_link': data.get('authorLink', ''),
            'source_link': data.get('source', '')
        })
        print(f"  ✓ {slug}: author_link={data.get('authorLink', 'N/A')}, source={data.get('source', 'N/A')}")
    
    print(f"\n✓ 准备更新 {len(updates)} 条记录")
    
    if not updates:
        print("⚠️  没有可更新的记录")
        return
    
    # 3. 更新
    print("\n🔄 开始更新 Supabase...")
    success_count = 0
    fail_count = 0
    
    for update in updates:
        slug = update['slug']
        try:
            response = client.table('prompts').update({
                'author_link': update['author_link'],
                'source_link': update['source_link']
            }).eq('slug', slug).execute()
            
            if hasattr(response, 'data') and response.data:
                print(f"  ✅ {slug}")
                success_count += 1
            else:
                print(f"  ❌ {slug}: 更新失败")
                fail_count += 1
        except Exception as e:
            print(f"  ❌ {slug}: {e}")
            fail_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ 更新完成: {success_count} 条成功, {fail_count} 条失败")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()