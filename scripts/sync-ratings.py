#!/usr/bin/env python3
"""批量同步评分数据到 Supabase"""
import requests, os, json, re, sys, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# 读取环境
project_root = Path(__file__).parent.parent
with open(project_root / '.env.local') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k] = v.strip('"').strip("'")

url = os.environ['NEXT_PUBLIC_SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

# 读取待更新数据
with open('/tmp/rating_updates.json') as f:
    updates = json.load(f)

print(f'📦 开始同步 {len(updates)} 条评分数据\n')

def update_one(row):
    slug = row['slug']
    for attempt in range(3):  # 重试3次
        try:
            resp = requests.patch(
                f'{url}/rest/v1/prompts?slug=eq.{slug}',
                headers=headers,
                json=row,
                timeout=30
            )
            return slug, resp.status_code in (200, 204)
        except Exception as e:
            if attempt < 2:
                time.sleep(1)  # 等待1秒后重试
            else:
                print(f'  ❌ {slug}: {str(e)[:50]}')
                return slug, False

success = 0
fail = 0

with ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(update_one, row): row for row in updates}
    
    for i, future in enumerate(as_completed(futures)):
        slug, ok = future.result()
        if ok:
            success += 1
        else:
            fail += 1
        
        if (i + 1) % 200 == 0:
            print(f'  进度: {i + 1}/{len(updates)} (成功: {success}, 失败: {fail})')

print(f'\n{"="*60}')
print(f'✅ 同步完成: {success} 成功, {fail} 失败')
print(f'{"="*60}')
