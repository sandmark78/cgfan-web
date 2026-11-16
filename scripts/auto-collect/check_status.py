#!/usr/bin/env python3
"""检查采集状态"""
import json
from pathlib import Path
from datetime import datetime

# 读取预处理数据
with open('data/auto-collect/preprocessed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(f'预处理数据条数: {len(data)}')

# 统计今天已下载的图片
today_images = []
for f in Path('public/images/prompts').glob('prompt-*.jpg'):
    mtime = datetime.fromtimestamp(f.stat().st_mtime)
    if mtime.date() == datetime.now().date():
        today_images.append(f.name)
print(f'今天已下载的图片: {len(today_images)}')
for img in sorted(today_images)[:15]:
    print(f'  - {img}')

# 检查今天已创建的markdown
today_dir = Path('content/prompts/2026/11/16')
today_md = list(today_dir.glob('*.md')) if today_dir.exists() else []
print(f'今天已创建的markdown: {len(today_md)}')

# 提取tweet_id列表
tweet_ids = [item.get('tweet_id') or item.get('id') for item in data]
print(f'\n前10条tweet_id: {tweet_ids[:10]}')
