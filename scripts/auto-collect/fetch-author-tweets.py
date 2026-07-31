#!/usr/bin/env python3
"""
抓取指定作者的最新推文ID
用法: python3 fetch-author-tweets.py @username
输出: 推文ID列表（最近24小时内）
"""

import subprocess
import json
import re
import sys
from datetime import datetime, timedelta

def run(cmd, timeout=30):
    """执行命令，返回 stdout"""
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip()

def camofox_cmd(cmd, timeout=30):
    """执行 camofox 命令"""
    return run(f"camofox {cmd}", timeout=timeout)

def fetch_latest_tweets(username):
    """抓取作者最新推文"""
    username = username.replace('@', '')
    url = f"https://x.com/{username}"
    
    print(f"🔍 抓取 @{username} 的最新推文...")
    
    # 清理旧 tab
    tabs_output = camofox_cmd("get-tabs 2>/dev/null")
    for m in re.finditer(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', tabs_output):
        camofox_cmd(f'close "{m.group()}" 2>/dev/null')
    run("sleep 1")
    
    # 打开作者主页
    out = camofox_cmd(f'open "{url}" 2>&1', timeout=60)
    m = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', out)
    if not m:
        print(f"❌ 打开页面失败")
        return []
    
    tab = m.group()
    print(f"✅ 页面已打开: {tab[:8]}...")
    
    # 等待页面加载
    run("sleep 5")
    
    # 提取推文ID和时间
    EXTRACT_JS = """JSON.stringify(
        Array.from(document.querySelectorAll('article')).slice(0, 10).map(article => {
            const timeEl = article.querySelector('time');
            const linkEl = article.querySelector('a[href*="/status/"]');
            
            if (!timeEl || !linkEl) return null;
            
            const datetime = timeEl.getAttribute('datetime');
            const href = linkEl.getAttribute('href');
            const match = href.match(/\\/status\\/(\\d+)/);
            
            if (!match) return null;
            
            return {
                id: match[1],
                datetime: datetime,
                text: article.innerText.substring(0, 200)
            };
        }).filter(x => x !== null)
    )"""
    
    with open("/tmp/extract_tweets.js", "w") as f:
        f.write(EXTRACT_JS)
    
    out = run(f"""camofox eval "$(cat /tmp/extract_tweets.js)" "{tab}" 2>&1""", timeout=15)
    
    # 关闭 tab
    run(f'camofox close "{tab}" 2>/dev/null')
    
    # 解析结果
    tweets = []
    for line in out.split('\n'):
        if line.startswith('result:'):
            try:
                tweets = json.loads(line[7:].strip())
            except:
                pass
            break
    
    # 过滤最近24小时的推文
    cutoff = datetime.now() - timedelta(hours=24)
    recent_tweets = []
    
    for tweet in tweets:
        try:
            tweet_time = datetime.fromisoformat(tweet['datetime'].replace('Z', '+00:00'))
            if tweet_time.replace(tzinfo=None) >= cutoff:
                recent_tweets.append(tweet)
        except:
            pass
    
    print(f"✅ 找到 {len(tweets)} 条推文，其中 {len(recent_tweets)} 条在最近24小时内")
    
    return recent_tweets

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 fetch-author-tweets.py @username")
        sys.exit(1)
    
    username = sys.argv[1]
    tweets = fetch_latest_tweets(username)
    
    # 输出推文ID
    tweet_ids = [t['id'] for t in tweets]
    print(f"\n最近24小时的推文ID:")
    for tid in tweet_ids:
        print(tid)
