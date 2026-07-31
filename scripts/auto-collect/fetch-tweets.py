#!/usr/bin/env python3
"""
自动采集高分作者推文
每天运行，抓取指定作者最近24小时的推文
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

def load_authors():
    """加载作者列表"""
    config_path = Path(__file__).parent / 'authors.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    config = load_authors()
    authors = config['authors']
    
    print(f"🚀 开始自动采集，共 {len(authors)} 位作者")
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    all_tweet_ids = []
    
    for i, author in enumerate(authors, 1):
        print(f"\n{'='*60}")
        print(f"[{i}/{len(authors)}] 作者: {author['name']} ({author['twitter']})")
        print(f"历史平均分: {author['avg_score']}")
        print(f"{'='*60}\n")
        
        # 限制每个作者抓取时间
        result = subprocess.run(
            ['python3', str(Path(__file__).parent / 'fetch_author_tweets.py'), author['twitter']],
            capture_output=True, text=True, timeout=30
        )
        
        if result.returncode != 0:
            print(f"⚠️  抓取失败: {result.stderr[:200]}")
            continue
        
        # 从输出中提取推文ID
        tweet_ids = []
        for line in result.stdout.split('\n'):
            if line.strip().isdigit() and len(line.strip()) >= 15:
                tweet_ids.append(line.strip())
        
        if tweet_ids:
            all_tweet_ids.extend(tweet_ids)
            print(f"✅ 找到 {len(tweet_ids)} 条新推文")
        else:
            print("⏭️  没有新推文")
    
    print(f"\n{'='*60}")
    print(f"采集完成，共 {len(all_tweet_ids)} 条新推文")
    print(f"{'='*60}\n")
    
    if not all_tweet_ids:
        print("没有新推文需要处理")
        return
    
    # 去重
    all_tweet_ids = list(set(all_tweet_ids))
    print(f"去重后: {len(all_tweet_ids)} 条推文")
    
    # 调用批量采集脚本
    print(f"\n🔄 开始批量采集推文内容...")
    tweet_ids_str = ' '.join(all_tweet_ids)
    result = subprocess.run(
        f"python3 scripts/batch-fetch-tweets.py {tweet_ids_str}",
        shell=True, timeout=300
    )
    
    if result.returncode != 0:
        print(f"❌ 批量采集失败")
        return
    
    print(f"✅ 批量采集完成")

if __name__ == '__main__':
    main()