#!/usr/bin/env python3
"""
抓取指定作者的最新推文ID
用法: python3 fetch_author_tweets.py @username
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
    """抓取作者最新推文ID"""
    username = username.replace('@', '')
    url = f"https://x.com/{username}"
    
    print(f"🔍 抓取 @{username} 的最新推文...")
    
    # 强制清理所有旧 tab（用 kill 确保干净）
    try:
        tabs_output = camofox_cmd("get-tabs 2>/dev/null", timeout=10)
        for m in re.finditer(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', tabs_output):
            try:
                camofox_cmd(f'close "{m.group()}" 2>/dev/null', timeout=5)
            except Exception:
                pass
    except Exception:
        # 如果 get-tabs 卡住，直接 kill 所有 camofox 进程
        import subprocess as sp
        sp.run("pkill -f camoufox 2>/dev/null", shell=True)
        run("sleep 2")
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
    run("sleep 3")
    
    # 只提取推文ID和时间（简化版，复用 batch-fetch-tweets.py 的逻辑）
    EXTRACT_JS = """JSON.stringify(
        Array.from(document.querySelectorAll('article')).slice(0, 10).map(article => {
            const linkEl = article.querySelector('a[href*="/status/"]');
            if (!linkEl) return null;
            
            const href = linkEl.getAttribute('href');
            const match = href.match(/\\/status\\/(\\d+)/);
            if (!match) return null;
            
            // 提取时间（相对时间如 1h, 2d）
            let timeText = '';
            const spans = article.querySelectorAll('span');
            for (const span of spans) {
                const text = span.innerText || '';
                if (/^\\d+[smhd]$/.test(text)) {
                    timeText = text;
                    break;
                }
            }
            
            return {
                id: match[1],
                time: timeText
            };
        }).filter(x => x !== null)
    )"""
    
    with open("/tmp/extract_ids.js", "w") as f:
        f.write(EXTRACT_JS)
    
    out = run(f"""camofox eval "$(cat /tmp/extract_ids.js)" "{tab}" 2>&1""", timeout=15)
    
    # 关闭 tab
    run(f'camofox close "{tab}" 2>/dev/null')
    
    # 解析结果
    tweets = []
    for line in out.split('\n'):
        if line.startswith('result:'):
            try:
                tweets = json.loads(line[7:].strip())
            except Exception as e:
                print(f"⚠️ JSON 解析失败: {e}")
            break
    
    # 过滤最近24小时的推文
    cutoff = datetime.now() - timedelta(hours=24)
    recent_tweets = []
    
    for tweet in tweets:
        time_str = tweet.get('time', '')
        if time_str:
            match = re.match(r'(\d+)([smhd])', time_str.lower())
            if match:
                value = int(match.group(1))
                unit = match.group(2)
                
                if unit == 's':
                    tweet_time = datetime.now() - timedelta(seconds=value)
                elif unit == 'm':
                    tweet_time = datetime.now() - timedelta(minutes=value)
                elif unit == 'h':
                    tweet_time = datetime.now() - timedelta(hours=value)
                elif unit == 'd':
                    tweet_time = datetime.now() - timedelta(days=value)
                else:
                    continue
                
                if tweet_time >= cutoff:
                    recent_tweets.append(tweet)
            else:
                # 无法解析时间，默认包含
                recent_tweets.append(tweet)
        else:
            # 没有时间信息，默认包含
            recent_tweets.append(tweet)
    
    print(f"✅ 找到 {len(tweets)} 条推文，其中 {len(recent_tweets)} 条在最近24小时内")
    
    return recent_tweets

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 fetch_author_tweets.py @username")
        sys.exit(1)
    
    # 全局超时保护：25秒后自动退出
    import signal
    def handler(signum, frame):
        print("⏰ 全局超时（25s），退出")
        sys.exit(1)
    signal.alarm(25)
    signal.signal(signal.SIGALRM, handler)
    
    username = sys.argv[1]
    tweets = fetch_latest_tweets(username)
    
    # 取消闹钟
    signal.alarm(0)
    
    # 输出推文ID
    tweet_ids = [t['id'] for t in tweets]
    print(f"\n最近24小时的推文ID:")
    for tid in tweet_ids:
        print(tid)
