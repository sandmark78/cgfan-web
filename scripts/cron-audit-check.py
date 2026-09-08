#!/usr/bin/env python3
"""Cron job quality audit - check Supabase data quality"""
import sys
import os
import re
from datetime import datetime, timedelta

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from supabase import create_client
except ImportError as e:
    print(f"ERROR: Missing dependency: {e}")
    sys.exit(1)

# Load .env.local manually (no dotenv dependency)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("ERROR: Missing Supabase credentials in .env.local")
    sys.exit(1)

sb = create_client(url, key)

# Get recent 7 days data
cutoff = (datetime.now() - timedelta(days=7)).isoformat()
result = sb.table('prompts').select('slug,title,prompt,cover,added,prompt_dna').gte('added', cutoff).order('added', desc=True).execute()
rows = result.data

print(f"最近7天收录: {len(rows)} 条")
print()

# Initialize issues tracker
issues = {
    'handle': [],
    'date': [],
    'interact': [],
    'cover': [],
    'scores': [],
    'title': [],
    'empty_prompt': []
}

for r in rows:
    p = r.get('prompt') or ''
    slug = r['slug']
    
    # Check @handle
    handles = re.findall(r'@[a-zA-Z0-9_]+', p)
    if handles:
        issues['handle'].append((slug, handles))
    
    # Check dates (2024-xx-xx, 2025-xx-xx, etc.)
    dates = re.findall(r'20[2-9]\d[-/\.]\d{1,2}[-/\.]\d{1,2}', p)
    if dates:
        issues['date'].append((slug, dates))
    
    # Check interaction data (likes, retweets, views, etc.)
    interaction_patterns = [
        r'\d+\s*(likes?|retweets?|views?|comments?|reposts?)',
        r'(likes?|retweets?|views?|comments?|reposts?)\s*:?\s*\d+'
    ]
    for pat in interaction_patterns:
        if re.findall(pat, p, re.IGNORECASE):
            issues['interact'].append((slug, pat))
            break
    
    # Check cover
    cover = r.get('cover') or ''
    if not cover:
        issues['cover'].append((slug, 'empty'))
    elif not cover.startswith('http') and not cover.startswith('/'):
        issues['cover'].append((slug, cover[:60]))
    
    # Check prompt_dna (scores)
    dna = r.get('prompt_dna')
    if not dna:
        issues['scores'].append((slug, 'missing'))
    elif isinstance(dna, dict):
        # Check if scores exist and are valid
        scores = dna.get('scores', {})
        if scores:
            vals = list(scores.values())
            bad = [v for v in vals if v is None or (isinstance(v, (int, float)) and (v < 0 or v > 10))]
            if bad:
                issues['scores'].append((slug, dna))
    
    # Check title
    if not r.get('title'):
        issues['title'].append(slug)
    
    # Check empty prompt
    if not (r.get('prompt') or '').strip():
        issues['empty_prompt'].append(slug)

# Print results
labels = {
    'handle': 'prompt 包含 @handle',
    'date': 'prompt 包含日期',
    'interact': 'prompt 包含互动数据',
    'cover': 'cover_url 异常',
    'scores': 'scores 缺失或超出范围',
    'title': 'title 缺失',
    'empty_prompt': 'prompt 为空'
}

for k, v in issues.items():
    print(f"=== {labels[k]} ===")
    if v:
        for item in v:
            print(f"  ❌ {item}")
    else:
        print("  ✅ 无问题")
    print()

total = sum(len(v) for v in issues.values())
print("=" * 60)
if total == 0:
    print("✅ 全部检查通过，数据质量良好")
else:
    print(f"⚠️ 发现 {total} 个问题需要修复")
