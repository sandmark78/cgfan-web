#!/usr/bin/env python3
"""
阶段1：检测作者 + 提取推文ID
轻量级，快速完成
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timedelta
import time
import re
import requests

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_DIR, PROJECT_ROOT

def load_authors():
    config_path = Path(__file__).parent / 'authors.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def check_recent_tweets(twitter_username, hours=24):
    """轻量级检测作者是否在最近N小时内发推"""
    try:
        url = f"https://x.com/{twitter_username}"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        
        if response.status_code != 200:
            return False, f"HTTP {response.status_code}"
        
        html = response.text
        timestamps = re.findall(r'"timestamp":(\d+)', html)
        
        if not timestamps:
            return False, "无时间戳"
        
        now = datetime.now()
        cutoff = now - timedelta(hours=hours)
        
        latest_time = None
        for ts in timestamps[:10]:
            ts_int = int(ts)
            if ts_int > 1e12:
                ts_int = ts_int // 1000
            
            tweet_time = datetime.fromtimestamp(ts_int)
            
            if latest_time is None or tweet_time > latest_time:
                latest_time = tweet_time
            
            if tweet_time >= cutoff:
                diff = now - tweet_time
                if diff.days == 0:
                    time_str = f"{diff.seconds//3600}小时前"
                else:
                    time_str = f"{diff.days}天前"
                return True, time_str
        
        if latest_time:
            diff = now - latest_time
            if diff.days == 0:
                time_str = f"最新: {diff.seconds//3600}小时前"
            else:
                time_str = f"最新: {diff.days}天前"
        else:
            time_str = "无新推文"
        
        return False, time_str
    except Exception as e:
        return False, f"检测失败: {str(e)}"

def camofox_cmd(cmd, timeout=30):
    try:
        r = subprocess.run(f"camofox {cmd}", shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

def extract_tweet_ids_from_author(author):
    """用camofox提取单个作者的推文ID"""
    twitter = author['twitter'].replace('@', '')
    url = f"https://x.com/{twitter}"
    
    # 打开tab
    out = camofox_cmd(f'open "{url}" 2>&1', timeout=30)
    m = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', out)
    if not m:
        return twitter, []
    
    tab = m.group()
    run("sleep 1")  # 减少等待时间
    
    # 提取推文ID和预览信息 - 写到文件避免shell转义问题
    EXTRACT_JS = """JSON.stringify(Array.from(document.querySelectorAll('article')).slice(0, 10).map(function(article) { 
        var linkEl = article.querySelector('a[href*="/status/"]'); 
        if (!linkEl) return null; 
        var href = linkEl.getAttribute('href'); 
        var match = href.match(/\\/status\\/(\\d+)/); 
        if (!match) return null; 
        
        // 提取时间
        var timeText = ''; 
        var spans = article.querySelectorAll('span'); 
        for (var i = 0; i < spans.length; i++) { 
            var text = spans[i].innerText || ''; 
            if (/^\\d+[smhd]$/.test(text)) { 
                timeText = text; 
                break; 
            } 
        }
        
        // 提取文本预览（直接提取article的文本）
        var textPreview = article.innerText.substring(0, 100);
        
        // 提取图片数量
        var allImgs = article.querySelectorAll('img');
        var imgCount = 0;
        for (var i = 0; i < allImgs.length; i++) {
            var src = allImgs[i].getAttribute('src') || '';
            if (src.indexOf('twimg.com/media') > -1) {
                imgCount++;
            }
        }
        
        // 检查是否有视频
        var video = article.querySelector('video');
        var hasVideo = video !== null;
        
        return { 
            id: match[1], 
            time: timeText,
            textPreview: textPreview,
            imgCount: imgCount,
            hasVideo: hasVideo
        }; 
    }).filter(function(x) { return x !== null; }))"""
    
    with open("/tmp/extract_ids.js", "w") as f:
        f.write(EXTRACT_JS)
    
    out = run(f"""camofox eval "$(cat /tmp/extract_ids.js)" "{tab}" 2>&1""", timeout=10)
    camofox_cmd(f'close "{tab}" 2>/dev/null')
    
    tweet_ids = []
    filtered_count = {'no_time': 0, 'has_video': 0, 'no_image': 0, 'text_too_short': 0}
    
    for line in out.split('\n'):
        if line.startswith('result:'):
            try:
                tweets = json.loads(line[7:].strip())
                cutoff = datetime.now() - timedelta(hours=24)
                for tweet in tweets:
                    # 检查是否有视频
                    if tweet.get('hasVideo', False):
                        filtered_count['has_video'] += 1
                        continue
                    
                    # 检查是否有图片
                    if tweet.get('imgCount', 0) == 0:
                        filtered_count['no_image'] += 1
                        continue
                    
                    # 检查文本长度（降低到30字）
                    text_preview = tweet.get('textPreview', '')
                    if len(text_preview) < 30:
                        filtered_count['text_too_short'] += 1
                        continue
                    
                    # 检查时间
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
                                tweet_ids.append(tweet['id'])
                        else:
                            filtered_count['no_time'] += 1
                    else:
                        filtered_count['no_time'] += 1
            except Exception as e:
                print(f"  ⚠️ {twitter} JSON 解析失败: {e}")
            break
    
    # 打印过滤统计
    if filtered_count['has_video'] > 0 or filtered_count['no_image'] > 0 or filtered_count['text_too_short'] > 0:
        print(f"    过滤: {filtered_count['has_video']}视频, {filtered_count['no_image']}无图, {filtered_count['text_too_short']}文本短")
    
    return twitter, tweet_ids

def main():
    config = load_authors()
    authors = config['authors']
    
    print(f"🚀 阶段1：检测 + 提取推文ID")
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 共 {len(authors)} 位作者\n")
    
    # 清理camofox
    subprocess.run("pkill -f camoufox 2>/dev/null", shell=True)
    time.sleep(2)
    
    # 检测活跃作者
    print(f"🔍 检测24小时内有发推的作者...")
    active_authors = []
    
    for author in authors:
        twitter = author['twitter'].replace('@', '')
        has_recent, time_info = check_recent_tweets(twitter, hours=24)
        
        if has_recent:
            active_authors.append(author)
            print(f"  ✅ {twitter}: {time_info}")
        else:
            print(f"  ⏭️ {twitter}: {time_info}")
    
    print(f"\n📊 检测结果: {len(active_authors)}/{len(authors)} 位作者24小时内有发推")
    
    if not active_authors:
        print("\n⚠️ 没有作者有新推文")
        # 保存空结果
        output_path = DATA_DIR / "tweet_ids.json"
        output_path.write_text("[]", encoding='utf-8')
        return
    
    # 提取推文ID
    print(f"\n🎯 提取 {len(active_authors)} 位活跃作者的推文ID...")
    all_tweet_ids = []
    
    for i, author in enumerate(active_authors):
        twitter, tweet_ids = extract_tweet_ids_from_author(author)
        if tweet_ids:
            # 限制每个作者最多3条
            tweet_ids = tweet_ids[:3]
            all_tweet_ids.extend(tweet_ids)
            print(f"  [{i+1}/{len(active_authors)}] ✅ {twitter}: {len(tweet_ids)} 条")
        else:
            print(f"  [{i+1}/{len(active_authors)}] ⏭️ {twitter}: 无新推文")
    
    # 去重
    all_tweet_ids = list(set(all_tweet_ids))
    
    print(f"\n{'='*60}")
    print(f"✅ 阶段1完成")
    print(f"共 {len(all_tweet_ids)} 条去重后的推文")
    print(f"{'='*60}\n")
    
    # 保存推文ID
    output_path = DATA_DIR / "tweet_ids.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_tweet_ids, f, ensure_ascii=False, indent=2)
    
    print(f"💾 推文ID已保存: {output_path}")
    print(f"\n👉 下一步运行: python3 scripts/auto-collect/fetch-content.py")

if __name__ == '__main__':
    main()
