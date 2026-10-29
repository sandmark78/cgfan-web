#!/usr/bin/env python3
import sys
sys.path.insert(0, 'scripts')
from supabase_utils import get_client
from datetime import datetime

client = get_client()
today = datetime.now().strftime('%Y-%m-%d')

# 查询今日收录
result = client.table('prompts').select('slug,title,added').gte('added', today).order('added', desc=False).execute()
print(f'Today collected: {len(result.data)} items')
for item in result.data[:20]:
    print(f'  - {item["title"]} ({item["slug"]})')
