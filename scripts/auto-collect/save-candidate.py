#!/usr/bin/env python3
"""
保存候选提示词（评分低于58分但仍有价值）
输出到 content/candidates/YYYY-MM-DD.json
"""

import json
import re
import os
from pathlib import Path
from datetime import datetime

def save_candidate(tweet, prompt, title, model, scores, total_score, category):
    """保存候选提示词到JSON文件"""
    candidates_dir = Path('content/candidates')
    candidates_dir.mkdir(parents=True, exist_ok=True)
    
    date = datetime.now().strftime('%Y-%m-%d')
    candidate_file = candidates_dir / f'{date}.json'
    
    # 读取已有候选
    candidates = []
    if candidate_file.exists():
        with open(candidate_file, 'r', encoding='utf-8') as f:
            candidates = json.load(f)
    
    tweet_id = tweet['id']
    
    # 提取图片URL
    imgs = tweet.get('imgs', [])
    cover = ''
    if imgs:
        img = imgs[0]
        if isinstance(img, dict):
            cover = img.get('src', '')
        else:
            cover = img
    
    # 生成编号
    next_id = len(candidates) + 1
    
    candidate = {
        'id': next_id,
        'tweet_id': tweet_id,
        'title': title,
        'prompt': prompt[:200] + ('...' if len(prompt) > 200 else ''),
        'prompt_full': prompt[:1000],
        'model': model,
        'category': category,
        'cover': cover,
        'source': f"https://x.com/i/status/{tweet_id}",
        'author': tweet.get('author', 'Unknown'),
        'scores': scores,
        'total_score': round(total_score, 1),
        'date': date,
        'added': datetime.now().isoformat(),
    }
    
    candidates.append(candidate)
    
    with open(candidate_file, 'w', encoding='utf-8') as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)
    
    print(f"  📋 已加入候选清单 (编号: {next_id})")
    return next_id