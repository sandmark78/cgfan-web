#!/usr/bin/env python3
"""检查并修复缺失的条目"""
import sys, re, yaml
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.supabase_utils import get_client

def parse_markdown(filepath):
    """解析 markdown，返回 (frontmatter, body)"""
    content = filepath.read_text(encoding='utf-8')
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)', content, re.DOTALL)
    if not match:
        return {}, ''
    fm = yaml.safe_load(match.group(1)) or {}
    body = match.group(2).strip()
    return fm, body

def main():
    client = get_client()
    target_slug = 'prompt-2109803089679331403'
    md_path = Path('content/prompts/2026-10-12/2109803089679331403.md')
    
    fm, body = parse_markdown(md_path)
    print(f"Slug: {fm.get('slug')}")
    print(f"Body length: {len(body)} chars")
    
    # 先检查是否存在
    check = client.table('prompts').select('slug,id,cover,source').eq('slug', target_slug).execute()
    print(f"\nExisting check: {len(check.data)} records")
    
    if not check.data:
        print(f"\n❌ 条目不存在于 Supabase，需要插入")
        # 构建完整插入数据（不包含 id，让 Supabase 自动生成 UUID）
        insert_data = {
            'slug': fm.get('slug', target_slug),
            'title': fm.get('title', ''),
            'prompt': body,  # 从 markdown body 提取
            'cover': fm.get('cover', ''),
            'images': fm.get('images', []),
            'source': fm.get('source', ''),
            'source_link': fm.get('source_link', ''),
            'author': fm.get('author', ''),
            'author_link': fm.get('authorLink', fm.get('author_link', '')),
            'date': fm.get('date', ''),
            'added': fm.get('added', ''),
            'model': fm.get('model', ''),
            'category': fm.get('category', ''),
            'tags': fm.get('tags', []),
            'score': fm.get('score', 0),
            'composition': fm.get('composition', 0),
            'color': fm.get('color', 0),
            'lighting': fm.get('lighting', 0),
            'detail': fm.get('detail', 0),
            'creativity': fm.get('creativity', 0),
            'technical': fm.get('technical', 0),
            'aesthetic': fm.get('aesthetic', 0),
            'curation': fm.get('curation', 0),
        }
        print(f"Inserting: {insert_data['slug']}")
        result = client.table('prompts').insert(insert_data).execute()
        print(f"Insert result: {len(result.data)} records inserted")
    else:
        print(f"\n✅ 条目已存在，执行更新")
        update_data = {
            'cover': fm.get('cover', ''),
            'source': fm.get('source', ''),
            'source_link': fm.get('source_link', ''),
            'author': fm.get('author', ''),
            'author_link': fm.get('authorLink', fm.get('author_link', '')),
        }
        result = client.table('prompts').update(update_data).eq('slug', target_slug).execute()
        print(f"Update result: {len(result.data)} records updated")
    
    # 最终验证
    final = client.table('prompts').select('slug,cover,source,source_link,author,author_link').eq('slug', target_slug).execute()
    print(f"\n✅ Final verification: {len(final.data)} record(s)")
    if final.data:
        print(f"   cover: {final.data[0].get('cover', 'N/A')}")
        print(f"   source: {final.data[0].get('source', 'N/A')}")
        print(f"   author: {final.data[0].get('author', 'N/A')}")

if __name__ == '__main__':
    main()
