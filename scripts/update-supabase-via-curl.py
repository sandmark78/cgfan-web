#!/usr/bin/env python3
"""
用 curl 更新 Supabase 中缺失 author_link 和 source_link 的记录
（空字符串，用 or= 组合查询）
"""
import json
import re
import subprocess
from pathlib import Path

project_root = Path(__file__).parent.parent

def extract_from_markdown(file_path):
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

def load_env():
    env = {}
    env_path = project_root / '.env.local'
    if env_path.exists():
        for line in env_path.read_text().split('\n'):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                env[key.strip()] = value.strip()
    return env

def main():
    env = load_env()
    url = env.get('NEXT_PUBLIC_SUPABASE_URL', '')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY', '')
    
    if not url or not key:
        print("❌ 缺少 Supabase 配置")
        return
    
    headers = [
        '-H', f'apikey: {key}',
        '-H', f'Authorization: Bearer {key}',
        '-H', 'Content-Type: application/json'
    ]
    
    # 1. 查询 author_link 或 source_link 为空的记录（仅今日）
    print("🔍 查询 Supabase 中缺失字段的记录...")
    
    query = f"{url}/rest/v1/prompts?select=slug,author_link,source_link&or=(author_link.eq.,source_link.eq.)&added=gte.2026-08-25"
    result = subprocess.run(
        ['curl', '-s', query] + headers,
        capture_output=True, text=True
    )
    
    try:
        data = json.loads(result.stdout)
        if isinstance(data, list):
            missing = [r['slug'] for r in data if not r.get('author_link') or not r.get('source_link')]
            print(f"✓ 找到 {len(missing)} 条记录")
        else:
            print(f"⚠️ 响应异常: {result.stdout[:200]}")
            return
    except Exception as e:
        print(f"⚠️ 查询失败: {e}")
        print(f"响应: {result.stdout[:200]}")
        return
    
    if not missing:
        print("✅ 没有缺失字段的记录")
        return
    
    # 2. 读取本地 markdown 文件
    print("\n📖 读取本地 markdown 文件...")
    content_dir = project_root / 'content' / 'prompts'
    
    updates = []
    
    for md_file in content_dir.rglob('*.md'):
        data = extract_from_markdown(md_file)
        if not data or 'slug' not in data:
            continue
        
        slug = data['slug']
        if slug not in missing:
            continue
        
        updates.append({
            'slug': slug,
            'author_link': data.get('authorLink', ''),
            'source_link': data.get('source', '')
        })
        print(f"  ✓ {slug}")
    
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
        body = json.dumps({
            'author_link': update['author_link'],
            'source_link': update['source_link']
        })
        
        result = subprocess.run(
            ['curl', '-s', '-X', 'PATCH',
             f"{url}/rest/v1/prompts?slug=eq.{slug}",
             *headers,
             '-d', body],
            capture_output=True, text=True
        )
        
        try:
            resp = json.loads(result.stdout)
            if isinstance(resp, list) and len(resp) > 0:
                print(f"  ✅ {slug}: {update['author_link']}")
                success_count += 1
            else:
                print(f"  ❌ {slug}: {result.stdout[:200]}")
                fail_count += 1
        except Exception as e:
            print(f"  ❌ {slug}: {e} | {result.stdout[:200]}")
            fail_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ 更新完成: {success_count} 条成功, {fail_count} 条失败")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()