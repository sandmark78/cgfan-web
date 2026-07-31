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

# 添加脚本路径
sys.path.insert(0, str(Path(__file__).parent))
from fetch_author_tweets import fetch_latest_tweets

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
    
    for author in authors:
        print(f"\n{'='*60}")
        print(f"作者: {author['name']} ({author['twitter']})")
        print(f"历史平均分: {author['avg_score']}")
        print(f"{'='*60}\n")
        
        # 抓取该作者的最新推文
        tweets = fetch_latest_tweets(author['twitter'])
        
        if tweets:
            tweet_ids = [t['id'] for t in tweets]
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
    
    # 保存推文ID列表
    output_path = Path(__file__).parent / 'new_tweet_ids.txt'
    with open(output_path, 'w') as f:
        for tid in all_tweet_ids:
            f.write(f"{tid}\n")
    
    print(f"💾 推文ID已保存到: {output_path}")
    
    # 调用批量采集脚本
    print(f"\n🔄 开始批量采集推文内容...")
    tweet_ids_str = ' '.join(all_tweet_ids)
    subprocess.run(f"python3 scripts/batch-fetch-tweets.py {tweet_ids_str}", shell=True)

if __name__ == '__main__':
    main()
