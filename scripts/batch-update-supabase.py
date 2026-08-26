#!/usr/bin/env python3
"""
批量更新 Supabase 缺失字段（简单版：curl PATCH，忽略响应判断）
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
    
    headers = [
        '-H', f'apikey: {key}',
        '-H', f'Authorization: Bearer {key}',
        '-H', 'Content-Type: application/json'
    ]
    
    # 1. 读取所有本地 markdown 文件（今天）
    print("📖 读取本地 markdown 文件...")
    content_dir = project_root / 'content' / 'prompts' / '2026' / '08' / '26'
    
    updates = []
    for md_file in content_dir.glob('*.md'):
        data = extract_from_markdown(md_file)
        if not data or 'slug' not in data:
            continue
        updates.append({
            'slug': data['slug'],
            'author_link': data.get('authorLink', ''),
            'source_link': data.get('source', '')
        })
    
    print(f"✓ 本地找到 {len(updates)} 条\n")
    
    # 2. 逐条 PATCH（PATCH 返回空数组就是成功）
    print("🔄 开始更新 Supabase...")
    success_count = 0
    
    for update in updates:
        slug = update['slug']
        body = json.dumps({
            'author_link': update['author_link'],
            'source_link': update['source_link']
        })
        
        result = subprocess.run(
            ['curl', '-s', '-X', 'PATCH',
             f"{url}/rest/v1/prompts?slug=eq.{slug}",
             *headers, '-d', body],
            capture_output=True, text=True
        )
        
        # PATCH 成功返回 []（空数组），失败返回错误对象
        if result.returncode == 0 and ('[]' in result.stdout or not result.stdout.strip()):
            print(f"  ✅ {slug}: {update['author_link']}")
            success_count += 1
        else:
            print(f"  ⚠️ {slug}: {result.stdout[:200]}")
    
    # 3. 验证
    print(f"\n{'='*60}")
    print(f"✅ 更新完成: {success_count} 条")
    print(f"{'='*60}")
    print("\n🔍 验证更新结果...")
    
    query = f"{url}/rest/v1/prompts?select=slug,author_link,source_link&or=(author_link.eq.,source_link.eq.)&added=gte.2026-08-25"
    result = subprocess.run(['curl', '-s', query] + headers, capture_output=True, text=True)
    try:
        data = json.loads(result.stdout)
        if isinstance(data, list) and data:
            print(f"⚠️ 仍有 {len(data)} 条缺失：")
            for r in data:
                print(f"  {r['slug']}")
        else:
            print("✅ 所有记录已更新")
    except:
        print(f"⚠️ 验证失败: {result.stdout[:200]}")

if __name__ == '__main__':
    main()