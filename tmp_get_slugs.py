#!/usr/bin/env python3
"""Get 3 random slugs from today for verification."""
import sys
import os
sys.path.insert(0, os.path.join('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web', 'scripts'))
from supabase_utils import get_client

client = get_client()
result = client.table('prompts').select('slug,title').gte('added', '2026-10-20').limit(3).execute()
for item in result.data:
    slug = item['slug']
    url = f'https://www.cgfan.com/prompt/{slug}'
    print(url)
