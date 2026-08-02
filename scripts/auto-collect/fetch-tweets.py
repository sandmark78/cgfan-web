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
import time
import os
import signal

def load_authors():
    """加载作者列表"""
    config_path = Path(__file__).parent / 'authors.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def fetch_author_with_timeout(script_path, author_twitter, timeout=30):
    """用 Popen + communicate 实现可靠超时"""
    try:
        proc = subprocess.Popen(
            ['python3', script_path, author_twitter],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = proc.communicate(timeout=timeout)
        tweet_ids = []
        for line in stdout.split('\n'):
            if line.strip().isdigit() and len(line.strip()) >= 15:
                tweet_ids.append(line.strip())
        return tweet_ids, None
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)
        return [], "超时"
    except Exception as e:
        try:
            proc.kill()
        except:
            pass
        return [], str(e)[:200]

def batch_fetch(tweet_ids, batch_size=8):
    """分批调用 batch-fetch-tweets.py，每批最多8条（留2个tab余量）"""
    all_results = []
    
    for i in range(0, len(tweet_ids), batch_size):
        batch = tweet_ids[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(tweet_ids) + batch_size - 1) // batch_size
        
        print(f"\n📦 批次 {batch_num}/{total_batches}: {len(batch)} 条推文")
        
        tweet_ids_str = ' '.join(batch)
        try:
            proc = subprocess.Popen(
                f"python3 scripts/batch-fetch-tweets.py {tweet_ids_str}",
                shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            stdout, stderr = proc.communicate(timeout=60)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
            print(f"  ⏰ 本批次超时（60s），跳过", flush=True)
            continue
        
        # 读取本批次结果
        batch_path = Path("/tmp/tweets_batch.json")
        if batch_path.exists():
            try:
                with open(batch_path, 'r') as f:
                    batch_data = json.load(f)
                all_results.extend(batch_data)
                print(f"  ✅ 本批次采集 {len(batch_data)}/{len(batch)} 条")
            except (json.JSONDecodeError, IOError) as e:
                print(f"  ⚠️ 本批次数据损坏: {e}")
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
    
    # 先清理所有 camofox 进程，避免残留 tab 干扰
    subprocess.run("pkill -f camoufox 2>/dev/null", shell=True)
    time.sleep(3)
    
    for i, author in enumerate(authors, 1):
        print(f"\n[{i}/{len(authors)}] {author['name']} ({author['twitter']})")
        
        sys.stdout.flush()
        print(f"  开始抓取...", flush=True)
        
        author_script = str(Path(__file__).parent / 'fetch_author_tweets.py')
        tweet_ids, error = fetch_author_with_timeout(author_script, author['twitter'], timeout=30)
        
        if error:
            print(f"  ⏰ {error}，跳过", flush=True)
            continue
        
        if tweet_ids:
            all_tweet_ids.extend(tweet_ids)
            print(f"  ✅ {len(tweet_ids)} 条新推文", flush=True)
        else:
            print(f"  ⏭️ 没有新推文", flush=True)
    
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
    all_data = []
    try:
        all_data = batch_fetch(all_tweet_ids, batch_size=8)
    except Exception as e:
        print(f"⚠️ 分批采集失败: {e}")
    
    # 保存合并结果
    output_path = Path("/tmp/tweets_batch.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 总共采集 {len(all_data)}/{len(all_tweet_ids)} 条推文内容")
    print(f"💾 数据已保存到: {output_path}")

if __name__ == '__main__':
    main()
