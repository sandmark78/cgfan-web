#!/usr/bin/env python3
import sys
sys.path.insert(0, 'scripts')
from supabase_utils import get_client
from datetime import datetime

client = get_client()
today = datetime.now().strftime('%Y-%m-%d')

# 查询今日收录
result = client.table('prompts').select('slug,title,prompt').gte('added', today).order('added', desc=False).execute()

# 找出标题过短的
short_titles = []
for item in result.data:
    title = item['title']
    # 检查标题是否过短或太泛
    if len(title) <= 10 or title in ['海报', '肖像', '字体', '花园', '风景'] or ('·' in title and len(title) <= 12):
        short_titles.append(item)
        print(f"过短标题: {title} ({item['slug']})")

if not short_titles:
    print("今日标题质量良好，无过短标题")
else:
    print(f"\n发现 {len(short_titles)} 条过短标题")
