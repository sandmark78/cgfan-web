#!/usr/bin/env python3
"""检查 prompt 杂质是否误报"""
import os, sys, re
from datetime import datetime, timedelta, timezone
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

env_file = project_root / '.env.local'
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

from supabase import create_client, Client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

tz = timezone(timedelta(hours=8))
seven_days_ago = (datetime.now(tz) - timedelta(days=7)).isoformat()

result = sb.table('prompts').select('slug,title,prompt,cover').gte('added', seven_days_ago).order('added', desc=True).execute()
data = result.data

# Check what triggers "互动数据"
interaction_pattern = re.compile(r'(likes?|views?|comments?|shares?|转[发发]|评[论]|点[赞])', re.I)

print("=== 检查'互动数据'误报 ===")
false_positives = 0
true_positives = 0
for d in data:
    prompt_text = d.get('prompt') or ''
    m = interaction_pattern.search(prompt_text)
    if m:
        # Show context around match
        start = max(0, m.start() - 20)
        end = min(len(prompt_text), m.end() + 20)
        context = prompt_text[start:end]
        matched_word = m.group()
        # Check if it's part of a larger word or actual interaction data
        # e.g. "high likes" vs "likes" as metadata
        if matched_word.lower() in ['like', 'likes', 'views', 'comments', 'shares']:
            # Check if surrounded by numbers or metadata-like context
            before = prompt_text[max(0,m.start()-30):m.start()]
            after = prompt_text[m.end():m.end()+30]
            # If it's in a descriptive context (e.g. "cinematic lighting"), it's a false positive
            # If it's near numbers or social media context, it's real
            if any(w in before.lower() + after.lower() for w in ['转发', '评论', '点赞', '阅读', '播放', '收藏']):
                true_positives += 1
                if true_positives <= 3:
                    print(f"  真阳性 [{d['slug']}]: ...{context}...")
            else:
                false_positives += 1
                if false_positives <= 5:
                    print(f"  误报 [{d['slug']}]: matched='{matched_word}' context='...{context}...'")

print(f"\n总计: 真阳性={true_positives}, 误报={false_positives}")

# Check cover paths
print("\n=== 检查 cover 路径 ===")
covers_ok = 0
covers_relative = 0
covers_bad = 0
for d in data:
    cover = d.get('cover', '')
    if cover.startswith('/'):
        covers_relative += 1
    elif cover.startswith('http'):
        covers_ok += 1
    else:
        covers_bad += 1
        if covers_bad <= 5:
            print(f"  异常 cover [{d['slug']}]: {cover[:80]}")

print(f"  相对路径: {covers_relative}, HTTP: {covers_ok}, 异常: {covers_bad}")

# Check the short title
print("\n=== 短标题检查 ===")
for d in data:
    title = d.get('title', '')
    if len(title) <= 4:
        print(f"  [{d['slug']}]: title='{title}' prompt前50字='{(d.get('prompt') or '')[:50]}'")

# Check model consistency
print("\n=== 模型名一致性 ===")
from collections import Counter
model_names = Counter()
for d in data:
    m = d.get('model', '') or ''
    model_names[m] += 1
for m, c in model_names.most_common():
    print(f"  '{m}': {c}条")
