#!/usr/bin/env python3
"""batch-fetch-tweets.py — 批量推文采集（并行优化版）
用法: python3 scripts/batch-fetch-tweets.py id1 id2 id3 ...
输出: /tmp/tweets_batch.json
图片: public/images/prompts/prompt-{id}.jpg
"""

import subprocess, json, re, sys, os
from concurrent.futures import ThreadPoolExecutor, as_completed

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

def run(cmd, timeout=30):
    """执行命令，返回 stdout"""
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip()

def camofox_cmd(cmd, timeout=30):
    """执行 camofox 命令"""
    return run(f"camofox {cmd}", timeout=timeout)

# ====== 参数 ======
ids = sys.argv[1:]
if not ids:
    print("用法: python3 scripts/batch-fetch-tweets.py <id1> <id2> ...")
    sys.exit(1)

# ====== Step 1: 清理旧 tab ======
print("🧹 清理旧 tab...")
tabs_output = camofox_cmd("get-tabs 2>/dev/null")
for m in re.finditer(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', tabs_output):
    camofox_cmd(f'close "{m.group()}" 2>/dev/null')
run("sleep 1")

# ====== Step 2: 串行开 tab（Camofox 单线程，并发会失败） ======
print(f"🚀 串行打开 {len(ids)} 个 tab...")
tabs = {}

for i, tid in enumerate(ids, 1):
    out = camofox_cmd(f'open "https://x.com/i/status/{tid}" 2>&1', timeout=60)
    m = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', out)
    if m:
        tab = m.group()
        tabs[tid] = tab
        print(f"  [{i}/{len(ids)}] ✅ {tid} → {tab[:8]}...")
    else:
        print(f"  [{i}/{len(ids)}] ❌ {tid} 打开失败")
    # 每个 tab 间隔 0.5s，避免并发冲突
    run("sleep 0.5")

# ====== Step 3: 统一等待 ======
print("⏳ 等待页面加载 (3s)...")
run("sleep 3")

# ====== Step 4: 串行提取（Camofox 单线程，不支持并发 eval） ======
print("📥 逐条提取内容...")
results = {}

# 先把 JS 代码写到文件，避免引号嵌套问题
EXTRACT_JS = """JSON.stringify({
  allText: Array.from(document.querySelectorAll("article")).map((a,i) => "===ARTICLE " + i + "===\\n" + a.innerText).join("\\n\\n"),
  imgs: Array.from(document.querySelectorAll("img")).filter(img => img.src.includes("pbs.twimg.com/media/")).map(img => ({ src: img.src, alt: img.alt || "" })),
  author: (document.querySelector('article [data-testid="User-Name"]') || {}).innerText?.split("\\n")[0] || "",
  date: (() => { const t = document.querySelector("article time"); return t ? new Date(t.getAttribute("datetime")).toISOString().split("T")[0] : ""; })()
})"""

with open("/tmp/extract_tweet.js", "w") as f:
    f.write(EXTRACT_JS)

for tid, tab in tabs.items():
    # 展开
    run(f"""camofox eval 'document.querySelectorAll("button").forEach(btn => {{ if (btn.textContent.includes("Show more") || btn.textContent.includes("显示更多")) btn.click(); }});' "{tab}" 2>/dev/null""")
    run("sleep 2")
    # 提取（从文件读取 JS）
    out = run(f"""camofox eval "$(cat /tmp/extract_tweet.js)" "{tab}" 2>&1""", timeout=15)
    # 关闭
    run(f'camofox close "{tab}" 2>/dev/null')
    
    # 解析
    data = None
    for line in out.split('\n'):
        if line.startswith('result:'):
            try:
                data = json.loads(line[7:].strip())
                data['id'] = tid
            except:
                pass
            break
    
    if data:
        # 从 allText 解析作者和日期（选择器可能失效）
        all_text = data.get('allText', '')
        lines = all_text.split('\n')
        
        # 提取作者：[0]===ARTICLE 0=== [1]作者名 [2]@handle
        if not data.get('author') and len(lines) >= 2:
            data['author'] = lines[1].strip()
        
        # 提取日期：找包含 AM/PM 和年份的行
        if not data.get('date'):
            from datetime import datetime
            for line in lines:
                if ('AM' in line or 'PM' in line) and '202' in line:
                    # 格式如 "6:09 PM · Jul 25, 2026"
                    m = re.search(r'(\w+ \d{1,2}, \d{4})', line)
                    if m:
                        try:
                            data['date'] = datetime.strptime(m.group(1), '%b %d, %Y').strftime('%Y-%m-%d')
                        except:
                            pass
                        break
        
        results[tid] = data
        print(f"  ✅ {tid}: 作者={data.get('author','?')}, 日期={data.get('date','?')}, 图片={len(data.get('imgs',[]))}张")
    else:
        print(f"  ❌ {tid}: 提取失败")

# ====== Step 5: 并行下载图片 ======
print("🖼️  并行下载图片...")

def download_image(tid, data):
    imgs = data.get('imgs', [])
    if not imgs:
        return tid, 0
    img = imgs[0]
    img_url = img['src'] if isinstance(img, dict) else img
    clean_url = img_url.split('?')[0] + '?format=jpg&name=orig'
    out_path = f"public/images/prompts/prompt-{tid}.jpg"
    run(f'curl -s -L -H "User-Agent: Mozilla/5.0" -o "{out_path}" "{clean_url}"')
    # Safari 兼容修复
    run(f'sips -s format jpeg -s formatOptions best "{out_path}" --out "{out_path}" 2>/dev/null')
    try:
        size = os.path.getsize(out_path)
        return tid, size
    except:
        return tid, 0

with ThreadPoolExecutor(max_workers=5) as pool:
    futures = [pool.submit(download_image, tid, data) for tid, data in results.items()]
    for f in as_completed(futures):
        tid, size = f.result()
        if size > 0:
            print(f"  ✅ {tid}: {size}B")
        else:
            print(f"  ⚠️  {tid}: 无图片")

# ====== Step 6: 输出汇总 ======
batch = list(results.values())
with open("/tmp/tweets_batch.json", "w") as f:
    json.dump(batch, f, ensure_ascii=False, indent=2)

print(f"\n📊 采集完成: {len(results)}/{len(ids)} 条成功")
print(f"   数据: /tmp/tweets_batch.json")
print(f"   图片: public/images/prompts/prompt-{{id}}.jpg")
