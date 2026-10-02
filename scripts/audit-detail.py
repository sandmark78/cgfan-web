#!/usr/bin/env python3
"""质量审计 - 详细数据明细（复用 deep-quality-audit.py 的环境加载方式）"""
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
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 缺少 Supabase 环境变量")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

tz = timezone(timedelta(hours=8))
seven_days_ago = (datetime.now(tz) - timedelta(days=7)).isoformat()
three_days_ago = (datetime.now(tz) - timedelta(days=3)).isoformat()

result = sb.table('prompts').select('*').gte('added', seven_days_ago).order('added', desc=True).execute()
data = result.data

# 打印第一条的所有字段名，确认 schema
if data:
    print(f'字段列表: {list(data[0].keys())}')
    print()

print(f'=== 最近7天收录明细 ({len(data)}条) ===\n')

cats = {}
for d in data:
    c = d.get('category') or '未知'
    cats[c] = cats.get(c, 0) + 1
print('📂 分类分布:')
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {c}: {n}条')
print()

models = {}
for d in data:
    m = (d.get('model') or '未知').strip()
    models[m] = models.get(m, 0) + 1
print('🤖 模型分布:')
for m, n in sorted(models.items(), key=lambda x: -x[1]):
    print(f'  {m}: {n}条')
print()

scores_list = [d.get('score_total', 0) or 0 for d in data]
if scores_list:
    print('📊 评分统计:')
    print(f'  最高: {max(scores_list)}')
    print(f'  最低: {min(scores_list)}')
    print(f'  平均: {sum(scores_list)/len(scores_list):.1f}')
    print(f'  中位: {sorted(scores_list)[len(scores_list)//2]}')
print()

print('🔍 异常检查:')
short = [d for d in data if d.get('title') and len(d['title']) <= 4]
print(f'  标题≤4字: {len(short)}条', [d['title'] for d in short[:5]] if short else '')

bad_cover = [d for d in data if not d.get('cover_url') or (d.get('cover_url') and not d['cover_url'].startswith('http'))]
print(f'  cover_url异常: {len(bad_cover)}条', [d['slug'] for d in bad_cover[:5]] if bad_cover else '')

no_score = [d for d in data if not d.get('score_total')]
print(f'  评分缺失: {len(no_score)}条')

handle_pattern = re.compile(r'@\w+')
date_pattern = re.compile(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}')
interaction_pattern = re.compile(r'(likes?|views?|comments?|shares?|转[发发]|评[论]|点[赞])', re.I)

problem_prompts = []
for d in data:
    prompt_text = d.get('prompt') or ''
    issues = []
    if handle_pattern.search(prompt_text):
        issues.append('@handle')
    if date_pattern.search(prompt_text):
        issues.append('日期')
    if interaction_pattern.search(prompt_text):
        issues.append('互动数据')
    if issues:
        problem_prompts.append((d['slug'], d.get('title',''), issues))

print(f'  prompt含杂质: {len(problem_prompts)}条')
for slug, title, issues in problem_prompts[:10]:
    print(f'    {slug}: {title[:25]} → {", ".join(issues)}')

recent = [d for d in data if d.get('added', '') >= three_days_ago]
print(f'\n=== 最近3天条目 ({len(recent)}条，按分数降序) ===')
recent_sorted = sorted(recent, key=lambda x: -(x.get('score_total', 0) or 0))
for d in recent_sorted[:30]:
    title = (d.get('title') or '')[:30]
    score = d.get('score_total', '-')
    cat = d.get('category') or ''
    model = ((d.get('model') or '') or '')[:15]
    added = (d.get('added') or '')[:10]
    print(f'  [{score}] {title} | {cat} | {model} | {added}')
