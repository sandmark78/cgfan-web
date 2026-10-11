#!/usr/bin/env python3
"""
修复 Supabase 中 source 和 author_link 字段问题
分批执行，避免超时
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

def fetch_data_batch(offset=0, limit=100):
    """分批获取数据"""
    resp = requests.get(
        f'{url}/rest/v1/prompts',
        params={
            'select': 'slug,source,source_link,author_link',
            'limit': limit,
            'offset': offset
        },
        headers=headers
    )
    return resp.json()

def fix_and_update_batch(offset=0, limit=100):
    """修复并更新一批数据"""
    data = fetch_data_batch(offset, limit)
    if not data:
        return 0, 0
    
    success = 0
    fail = 0
    
    for record in data:
        slug = record['slug']
        source = record.get('source', '')
        source_link = record.get('source_link', '')
        author_link = record.get('author_link', '')
        
        updates = {}
        
        # 修复 source 字段（如果不一致）
        if source_link and source != source_link:
            updates['source'] = source_link
        
        # 修复 author_link 字段（如果缺失）
        if not author_link and source_link:
            username = extract_username_from_url(source_link)
            if username:
                updates['author_link'] = f'https://x.com/{username}'
        
        # 执行更新
        if updates:
            resp = requests.patch(
                f'{url}/rest/v1/prompts?slug=eq.{slug}',
                headers=headers,
                json=updates
            )
            
            if resp.status_code == 200:
                success += 1
            else:
                fail += 1
    
    return success, fail

def main():
    print("🔄 开始分批修复 Supabase 数据...\n")
    
    total_success = 0
    total_fail = 0
    offset = 0
    batch_size = 100
    
    while True:
        print(f"处理批次 offset={offset}...")
        success, fail = fix_and_update_batch(offset, batch_size)
        
        total_success += success
        total_fail += fail
        
        print(f"  ✅ 成功: {success}, ❌ 失败: {fail}")
        
        offset += batch_size
        
        # 每10批输出一次总计
        if (offset // batch_size) % 10 == 0:
            print(f"\n📊 当前进度: 已处理 {offset} 条，成功 {total_success}，失败 {total_fail}\n")
    
    print(f"\n{'='*60}")
    print(f"✅ 修复完成")
    print(f"  总成功: {total_success}")
    print(f"  总失败: {total_fail}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
