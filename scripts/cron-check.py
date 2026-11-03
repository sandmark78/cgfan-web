#!/usr/bin/env python3
"""Cron job: check today's collection stats and title quality."""
import json
import sys
from datetime import datetime

sys.path.insert(0, 'scripts')

today = datetime.now().strftime('%Y-%m-%d')

# 1. Check preprocessed.json for today's items
print("=== preprocessed.json 统计 ===")
with open('data/auto-collect/preprocessed.json', 'r') as f:
    preprocessed = json.load(f)

today_pre = [item for item in preprocessed if item.get('added', '').startswith(today)]
print(f"总条数: {len(preprocessed)}")
print(f"今日({today})条数: {len(today_pre)}")
for item in today_pre[:10]:
    print(f"  - {item.get('title', '无标题')} | slug: {item.get('slug', '')}")

# 2. Check Supabase
print("\n=== Supabase 收录统计 ===")
try:
    from supabase_utils import get_client
    client = get_client()
    
    # Today's records
    result = client.table('prompts').select('slug,title,prompt,added').gte('added', today).execute()
    print(f"今日收录: {len(result.data)} 条")
    
    short_titles = []
    for item in result.data:
        title = item.get('title', '')
        if len(title) <= 10 or title in ['海报', '肖像', '字体', '袜子', '花园', '纸张', '星星'] or ('·' in title and len(title) <= 12):
            short_titles.append(item)
        print(f"  - [{item.get('slug', '')}] {title}")
    
    print(f"\n=== 标题过短: {len(short_titles)} 条 ===")
    for item in short_titles:
        print(f"  - [{item.get('slug', '')}] {item.get('title', '')} (prompt: {item.get('prompt', '')[:80]}...)")
    
    # Save short titles for fix
    if short_titles:
        with open('data/auto-collect/short_titles_today.json', 'w') as f:
            json.dump(short_titles, f, ensure_ascii=False, indent=2)
        print(f"\n已保存短标题列表到 data/auto-collect/short_titles_today.json")
    
except Exception as e:
    print(f"Supabase 查询失败: {e}")
