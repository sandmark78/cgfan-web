#!/usr/bin/env python3
"""
自动采集高分作者推文
每天运行，抓取指定作者最近24小时的推文

⚠️ 关键：Camofox 最多同时开10个tab，必须分批处理
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

def batch_fetch(tweet_ids, batch_size=8):
    """分批调用 batch-fetch-tweets.py，每批最多8条（留2个tab余量）"""
    all_results = []
    
    for i in range(0, len(tweet_ids), batch_size):
        batch = tweet_ids[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(tweet_ids) + batch_size - 1) // batch_size
        
        print(f"\n📦 批次 {batch_num}/{total_batches}: {len(batch)} 条推文")
        
        tweet_ids_str = ' '.join(batch)
        result = subprocess.run(
            f"python3 scripts/batch-fetch-tweets.py {tweet_ids_str}",
            shell=True, timeout=120,
            capture_output=True, text=True
        )
        
        # 读取本批次结果
        batch_path = Path("/tmp/tweets_batch.json")
        if batch_path.exists():
            with open(batch_path, 'r') as f:
                batch_data = json.load(f)
            all_results.extend(batch_data)
            print(f"  ✅ 本批次采集 {len(batch_data)}/{len(batch)} 条")
            # 删除临时文件，避免下一批覆盖
            batch_path.unlink()
        else:
            print(f"  ❌ 本批次无数据")
    
    return all_results

def main():
    config = load_authors()
    authors = config['authors']
    
    print(f"🚀 开始自动采集，共 {len(authors)} 位作者")
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    all_tweet_ids = []
    
    for i, author in enumerate(authors, 1):
        print(f"\n[{i}/{len(authors)}] {author['name']} ({author['twitter']})")
        
        # 抓取该作者的最新推文（带重试）
        author_ok = False
        for attempt in range(3):
            result = subprocess.run(
                ['python3', str(Path(__file__).parent / 'fetch_author_tweets.py'), author['twitter']],
                capture_output=True, text=True, timeout=30
            )
            
            if result.returncode == 0:
                author_ok = True
                break
            else:
                print(f"  ⚠️ 尝试 {attempt+1}/3 失败，等待 {attempt*5} 秒...")
                import time
                time.sleep(attempt * 5)
        
        if not author_ok:
            print(f"  ❌ 抓取失败（3次重试后放弃）")
            continue
        
        # 从输出中提取推文ID
        tweet_ids = []
        for line in result.stdout.split('\n'):
            if line.strip().isdigit() and len(line.strip()) >= 15:
                tweet_ids.append(line.strip())
        
        if tweet_ids:
            all_tweet_ids.extend(tweet_ids)
            print(f"  ✅ {len(tweet_ids)} 条新推文")
        else:
            print(f"  ⏭️ 没有新推文")
    
    # 去重
    all_tweet_ids = list(set(all_tweet_ids))
    print(f"\n{'='*60}")
    print(f"共 {len(all_tweet_ids)} 条去重后的新推文")
    print(f"{'='*60}\n")
    
    if not all_tweet_ids:
        print("没有新推文需要处理")
        return
    
    # 分批采集（每批8条，避免Camofox并发限制）
    print(f"🔄 开始分批采集推文内容（每批8条）...")
    all_data = batch_fetch(all_tweet_ids, batch_size=8)
    
    # 保存合并结果
    output_path = Path("/tmp/tweets_batch.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 总共采集 {len(all_data)}/{len(all_tweet_ids)} 条推文内容")
    print(f"💾 数据已保存到: {output_path}")

if __name__ == '__main__':
    main()
