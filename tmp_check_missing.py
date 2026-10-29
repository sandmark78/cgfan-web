#!/usr/bin/env python3
import sys
sys.path.insert(0, 'scripts')
from supabase_utils import get_client

client = get_client()

# 检查缺失图片的条目是否在 Supabase 中
missing_slugs = [
    'prompt-2115005613402956238',
    'prompt-2115156603930656823',
    'prompt-2115034792404324628',
    'prompt-2115036280916451635',
    'prompt-2115000503151231060',
    'prompt-2115019985391374745',
    'prompt-2114918058880077938',
    'prompt-2115080306739085592',
    'prompt-2114946920372466002',
    'prompt-2115025093277462890',
    'prompt-2115004584498520111',
    'prompt-2114938742721204385',
    'prompt-2114981428446593507',
    'prompt-2114924293964636224',
]

for slug in missing_slugs:
    result = client.table('prompts').select('slug,title,added').eq('slug', slug).execute()
    if result.data:
        print(f"✓ In DB: {slug} - {result.data[0]['title']} (added: {result.data[0]['added']})")
    else:
        print(f"✗ NOT in DB: {slug}")
