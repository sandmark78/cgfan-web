#!/usr/bin/env python3
"""
修复 Supabase 中 source_link 和 author_link 为 null 的数据
"""

import requests
import os
import json
import re
from pathlib import Path

# 加载环境变量
env_path = Path('.env.local')
with open(env_path) as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k] = v.strip('"').strip("'")

url = os.environ['NEXT_PUBLIC_SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

def extract_username_from_url(url):
    """从 x.com 链接提取用户名"""
    if not url or 'x.com' not in url:
        return None
    
    match = re.search(r'x\.com/([^/]+)', url)
    if match:
        username = match.group(1)
        if username not in ['i', 'intent', 'search', 'hashtag']:
            return username
    return None

def fix_null_links():
    """修复 source_link 和 author_link 为 null 的数据"""
    
    # 查询所有 source_link 或 author_link 为 null 的数据
    offset = 0
    total_fixed = 0
    
    while True:
        resp = requests.get(
            f'{url}/rest/v1/prompts',
            params={
                'select': 'slug,source,source_link,author_link',
                'or': f'(source_link.is.null,author_link.is.null)',
                'limit': 100,
                'offset': offset
            },
            headers=headers
        )
        
        data = resp.json()
        if not data:
            break
        
        print(f"查询到 {len(data)} 条需要修复的数据")
        
        for record in data:
            slug = record['slug']
            source = record.get('source', '')
            source_link = record.get('source_link')
            author_link = record.get('author_link')
            
            updates = {}
            
            # 修复 source_link
            if source_link is None and source:
                if 'x.com' in source or 'twitter.com' in source:
                    updates['source_link'] = source
                elif source.startswith('@'):
                    username = source[1:]
                    updates['source_link'] = f'https://x.com/{username}'
            
            # 修复 author_link
            if author_link is None:
                # 从 source_link 提取
                link_to_use = updates.get('source_link') or source_link
                if link_to_use:
                    username = extract_username_from_url(link_to_use)
                    if username:
                        updates['author_link'] = f'https://x.com/{username}'
            
            # 执行更新
            if updates:
                resp = requests.patch(
                    f'{url}/rest/v1/prompts?slug=eq.{slug}',
                    headers=headers,
                    json=updates
                )
                
                if resp.status_code in [200, 204]:  # 204 表示成功但无返回内容
                    total_fixed += 1
                    print(f"  ✅ 修复 {slug}: {json.dumps(updates, ensure_ascii=False)}")
                else:
                    print(f"  ❌ 修复失败 {slug}: {resp.status_code}")
        
        offset += 100
        
        # 如果返回的数据少于100条，说明已经处理完了
        if len(data) < 100:
            break
    
    print(f"\n✅ 完成！共修复 {total_fixed} 条数据")

if __name__ == '__main__':
    fix_null_links()
