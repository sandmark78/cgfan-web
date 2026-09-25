#!/usr/bin/env python3
"""
阶段2：批量抓取推文内容
读取阶段1提取的推文ID，用camofox抓取完整内容
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
import time

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_DIR, TWEETS_BATCH, PROJECT_ROOT

def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

def fetch_tweet_content(tweet_id):
    """用camofox抓取单条推文的完整内容"""
    url = f"https://x.com/i/status/{tweet_id}"
    
    # 打开tab
    out = run(f'camofox open "{url}" 2>&1', timeout=30)
    import re
    m = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', out)
    if not m:
        return None
    
    tab = m.group()
    time.sleep(1)  # 等待页面加载
    
    # 提取完整内容 - 写到文件避免shell转义问题
    EXTRACT_JS = """JSON.stringify((function() {
        var article = document.querySelector('article');
        if (!article) return null;
        
        var author = '', authorLink = '';
        var authorLinks = article.querySelectorAll('a[role="link"]');
        for (var i = 0; i < authorLinks.length; i++) {
            var href = authorLinks[i].getAttribute('href') || '';
            if (href.indexOf('/status/') === -1 && href.charAt(0) === '/') {
                authorLink = 'https://x.com' + href;
                var nameEl = authorLinks[i].querySelector('span');
                if (nameEl) author = nameEl.innerText.trim();
                break;
            }
        }
        
        var text = article.innerText || '';
        
        var imgs = [];
        var allImgs = article.querySelectorAll('img');
        for (var i = 0; i < allImgs.length; i++) {
            var src = allImgs[i].getAttribute('src') || '';
            var alt = allImgs[i].getAttribute('alt') || '';
            if (src.indexOf('twimg.com/media') > -1) {
                imgs.push({ src: src, alt: alt });
            }
        }
        
        var timeEl = article.querySelector('time');
        var date = timeEl ? timeEl.getAttribute('datetime') : '';
        
        return {
            id: '%s',
            author: author,
            authorLink: authorLink,
            text: text,
            imgs: imgs,
            date: date,
            allText: text
        };
    })())""" % tweet_id
    
    with open("/tmp/extract_content.js", "w") as f:
        f.write(EXTRACT_JS)
    
    out = run(f"""camofox eval "$(cat /tmp/extract_content.js)" "{tab}" 2>&1""", timeout=10)
    run(f'camofox close "{tab}" 2>/dev/null')
    
    for line in out.split('\n'):
        if line.startswith('result:'):
            try:
                return json.loads(line[7:].strip())
            except Exception as e:
                print(f"  ⚠️ {tweet_id} JSON 解析失败: {e}")
                return None
    
    return None

def main():
    # 读取推文ID
    ids_path = DATA_DIR / "tweet_ids.json"
    if not ids_path.exists():
        print(f"❌ 找不到推文ID文件: {ids_path}")
        print(f"👉 请先运行: python3 scripts/auto-collect/fetch-ids.py")
        return
    
    with open(ids_path, 'r', encoding='utf-8') as f:
        tweet_ids = json.load(f)
    
    if not tweet_ids:
        print("⚠️ 没有推文ID需要抓取")
        return
    
    print(f"🚀 阶段2：批量抓取推文内容")
    print(f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 共 {len(tweet_ids)} 条推文\n")
    
    # 清理camofox
    subprocess.run("pkill -f camoufox 2>/dev/null", shell=True)
    time.sleep(2)
    
    # 批量抓取
    all_data = []
    batch_size = 6  # 每批6条
    
    for i in range(0, len(tweet_ids), batch_size):
        batch = tweet_ids[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(tweet_ids) + batch_size - 1) // batch_size
        
        print(f"\n📦 批次 {batch_num}/{total_batches}: {len(batch)} 条")
        
        for j, tweet_id in enumerate(batch):
            print(f"  [{j+1}/{len(batch)}] 抓取 {tweet_id}...", end=' ', flush=True)
            
            data = fetch_tweet_content(tweet_id)
            if data:
                all_data.append(data)
                author = data.get('author', '?')
                img_count = len(data.get('imgs', []))
                print(f"✅ {author} ({img_count}张图片)")
            else:
                print(f"❌ 失败")
    
    print(f"\n{'='*60}")
    print(f"✅ 阶段2完成")
    print(f"成功抓取 {len(all_data)}/{len(tweet_ids)} 条")
    print(f"{'='*60}\n")
    
    # 保存结果
    output_path = DATA_DIR / "tweets_batch_all.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    # 复制到标准路径
    import shutil
    shutil.copy2(output_path, TWEETS_BATCH)
    
    print(f"💾 数据已保存: {output_path}")
    print(f"💾 同步到: {TWEETS_BATCH}")
    print(f"\n👉 下一步运行: python3 scripts/auto-collect/preprocess.py")

if __name__ == '__main__':
    main()
