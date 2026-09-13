#!/usr/bin/env python3
"""
自动采集高分作者推文 v2 - 批量并行优化版
31 个作者分 6 批，每批 5-6 个，总时间 < 5 分钟
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
import time
import re
import os

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_DIR, TWEETS_BATCH, PROJECT_ROOT

def load_authors():
    """加载作者列表"""
    config_path = Path(__file__).parent / 'authors.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def camofox_cmd(cmd, timeout=30):
    """执行 camofox 命令"""
    try:
        r = subprocess.run(f"camofox {cmd}", shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

def run(cmd, timeout=30):
    """执行命令，返回 stdout"""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

def scan_authors_batch(author_batch, batch_num, total_batches):
    """批量扫描一批作者（5-6 个），返回 {twitter: [tweet_ids]}"""
    print(f"\n{'='*60}")
    print(f"📦 批次 {batch_num}/{total_batches}: {len(author_batch)} 位作者")
    print(f"{'='*60}")
    
    # 清理旧 tab
    tabs_output = camofox_cmd("get-tabs 2>/dev/null", timeout=10)
    for m in re.finditer(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', tabs_output):
        camofox_cmd(f'close "{m.group()}" 2>/dev/null', timeout=5)
    run("sleep 0.5")
    
    # 串行打开所有作者的 tab（camofox 单线程）
    tabs = {}
    for author in author_batch:
        twitter = author['twitter'].replace('@', '')
        url = f"https://x.com/{twitter}"
        out = camofox_cmd(f'open "{url}" 2>&1', timeout=30)
        m = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', out)
        if m:
            tab = m.group()
            tabs[twitter] = tab
            print(f"  ✅ {twitter} → {tab[:8]}...")
        else:
            print(f"  ❌ {twitter} 打开失败")
        run("sleep 0.3")  # 每个 tab 间隔 0.3s
    
    # 统一等待页面加载
    print(f"  ⏳ 等待加载 (2s)...")
    run("sleep 2")
    
    # 提取推文 ID 的 JS
    EXTRACT_JS = """JSON.stringify(
        Array.from(document.querySelectorAll('article')).slice(0, 10).map(article => {
            const linkEl = article.querySelector('a[href*="/status/"]');
            if (!linkEl) return null;
            const href = linkEl.getAttribute('href');
            const match = href.match(/\\/status\\/(\\d+)/);
            if (!match) return null;
            let timeText = '';
            const spans = article.querySelectorAll('span');
            for (const span of spans) {
                const text = span.innerText || '';
                if (/^\\d+[smhd]$/.test(text)) {
                    timeText = text;
                    break;
                }
            }
            return { id: match[1], time: timeText };
        }).filter(x => x !== null)
    )"""
    
    with open("/tmp/extract_ids_v2.js", "w") as f:
        f.write(EXTRACT_JS)
    
    # 逐条提取（串行，camofox 不支持并发 eval）
    results = {}
    for twitter, tab in tabs.items():
        out = run(f"""camofox eval "$(cat /tmp/extract_ids_v2.js)" "{tab}" 2>&1""", timeout=10)
        camofox_cmd(f'close "{tab}" 2>/dev/null')
        
        tweet_ids = []
        for line in out.split('\n'):
            if line.startswith('result:'):
                try:
                    tweets = json.loads(line[7:].strip())
                    # 过滤 48 小时内的推文（放宽到 48h 增加数据量）
                    from datetime import timedelta
                    cutoff = datetime.now() - timedelta(hours=48)
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
                                    tweet_ids.append(tweet['id'])
                        else:
                            tweet_ids.append(tweet['id'])
                except Exception as e:
                    print(f"  ⚠️ {twitter} JSON 解析失败: {e}")
                break
        
        results[twitter] = tweet_ids
        if tweet_ids:
            print(f"  ✅ {twitter}: {len(tweet_ids)} 条推文")
        else:
            print(f"  ⏭️ {twitter}: 无新推文")
    
    return results

def batch_fetch_content(tweet_ids, batch_size=6):
    """分批采集推文内容"""
    all_results = []
    output_path = DATA_DIR / "tweets_batch_all.json"
    output_path.write_text("[]", encoding='utf-8')
    
    for i in range(0, len(tweet_ids), batch_size):
        batch = tweet_ids[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(tweet_ids) + batch_size - 1) // batch_size
        
        print(f"\n📦 内容采集批次 {batch_num}/{total_batches}: {len(batch)} 条")
        
        tweet_ids_str = ' '.join(batch)
        try:
            proc = subprocess.Popen(
                f"python3 scripts/batch-fetch-tweets.py {tweet_ids_str}",
                shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                cwd=str(PROJECT_ROOT)
            )
            stdout, stderr = proc.communicate(timeout=120)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)
            print(f"  ⏰ 本批次超时，跳过")
            continue
        
        # 读取本批次结果
        batch_path = DATA_DIR / "tweets_batch_temp.json"
        if batch_path.exists():
            try:
                with open(batch_path, 'r') as f:
                    batch_data = json.load(f)
                all_results.extend(batch_data)
                # 追加到总结果
                with open(output_path, 'r') as f:
                    all_data = json.load(f)
                all_data.extend(batch_data)
                with open(output_path, 'w') as f:
                    json.dump(all_data, f, ensure_ascii=False, indent=2)
                print(f"  ✅ {len(batch_data)}/{len(batch)} 条，累计 {len(all_data)} 条")
            except (json.JSONDecodeError, IOError) as e:
                print(f"  ⚠️ 数据损坏: {e}")
            batch_path.unlink()
        else:
            print(f"  ❌ 无数据")
    
    return all_results

def main():
    config = load_authors()
    authors = config['authors']
    
    print(f"🚀 自动采集 v2，共 {len(authors)} 位作者")
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"⚡ 批量并行模式，预计 3-5 分钟\n")
    
    # 清理 camofox
    subprocess.run("pkill -f camoufox 2>/dev/null", shell=True)
    time.sleep(2)
    
    # 分批扫描（每批 5-6 个作者）
    batch_size = 6
    all_tweet_ids = []
    author_status = []
    
    for i in range(0, len(authors), batch_size):
        batch = authors[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(authors) + batch_size - 1) // batch_size
        
        results = scan_authors_batch(batch, batch_num, total_batches)
        
        for author in batch:
            twitter = author['twitter'].replace('@', '')
            tweet_ids = results.get(twitter, [])
            if tweet_ids:
                all_tweet_ids.extend(tweet_ids)
                author_status.append({
                    'name': author['name'],
                    'twitter': author['twitter'],
                    'status': 'success',
                    'count': len(tweet_ids)
                })
            else:
                author_status.append({
                    'name': author['name'],
                    'twitter': author['twitter'],
                    'status': 'no_tweets',
                    'count': 0
                })
    
    # 去重
    all_tweet_ids = list(set(all_tweet_ids))
    print(f"\n{'='*60}")
    print(f"共 {len(all_tweet_ids)} 条去重后的推文")
    print(f"{'='*60}\n")
    
    if not all_tweet_ids:
        print("没有推文需要处理")
        # 保存状态
        status_path = DATA_DIR / "author_fetch_status.json"
        with open(status_path, 'w', encoding='utf-8') as f:
            json.dump(author_status, f, ensure_ascii=False, indent=2)
        return
    
    # 采集内容
    all_data = batch_fetch_content(all_tweet_ids, batch_size=6)
    
    # 保存作者状态
    status_path = DATA_DIR / "author_fetch_status.json"
    with open(status_path, 'w', encoding='utf-8') as f:
        json.dump(author_status, f, ensure_ascii=False, indent=2)
    
    # 复制到标准路径
    import shutil
    output_path = DATA_DIR / "tweets_batch_all.json"
    shutil.copy2(output_path, TWEETS_BATCH)
    
    # 统计
    success_count = sum(1 for s in author_status if s['status'] == 'success')
    no_tweets_count = sum(1 for s in author_status if s['status'] == 'no_tweets')
    
    print(f"\n📊 采集完成")
    print(f"  总推文: {len(all_data)} 条")
    print(f"  成功作者: {success_count}/{len(authors)}")
    print(f"  无推文: {no_tweets_count} 位")
    print(f"💾 数据: {output_path}")

if __name__ == '__main__':
    main()
