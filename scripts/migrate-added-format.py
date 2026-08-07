#!/usr/bin/env python3
"""批量将 added 字段从纯日期格式转为 ISO 时间戳（按日期分组批量更新）"""
import sys, re
from collections import defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.supabase_utils import get_client

client = get_client()

# 获取所有 added 为纯日期格式的
all_data = []
page = 0
while True:
    data = client.table('prompts').select('slug,added').range(page*1000, (page+1)*1000-1).execute()
    if not data.data:
        break
    all_data.extend(data.data)
    if len(data.data) < 1000:
        break
    page += 1

# 按日期分组
date_groups = defaultdict(int)
for r in all_data:
    a = r['added'] or ''
    if re.match(r'^\d{4}-\d{2}-\d{2}$', a):
        date_groups[a] += 1

print(f'共 {len(all_data)} 条，涉及的纯日期: {len(date_groups)} 个')

# 对每个日期执行一次批量 update（只更新 added 字段）
updated = 0
for date_str, count in sorted(date_groups.items()):
    iso_time = f"{date_str}T00:00:00.000Z"
    result = client.table('prompts').update({'added': iso_time}).eq('added', date_str).execute()
    if result.data:
        updated += len(result.data)
    print(f'  {date_str} → {iso_time} ({count}条)')

print(f'✅ 已更新 {updated} 条记录')