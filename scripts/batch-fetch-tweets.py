#!/usr/bin/env python3
"""batch-fetch-tweets.py — 批量推文采集（并行优化版）
用法: python3 scripts/batch-fetch-tweets.py id1 id2 id3 ...
输出: data/auto-collect/tweets_batch_temp.json (供 fetch-tweets.py 读取)
图片: public/images/prompts/prompt-{id}.jpg
"""

import subprocess, json, re, sys, os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

# 输出路径（与 fetch-tweets.py 期望的路径一致）
DATA_DIR = Path("data/auto-collect")
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH = DATA_DIR / "tweets_batch_temp.json"

def run(cmd, timeout=30):
    """执行命令，返回 stdout。超时返回空字符串，不抛异常"""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

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
  imgs: (() => {
    const firstArticle = document.querySelector("article");
    if (!firstArticle) return [];
    return Array.from(firstArticle.querySelectorAll("img"))
      .filter(img => img.src.includes("pbs.twimg.com/media/"))
      .slice(0, 4)
      .map(img => ({ src: img.src, alt: img.alt || "" }));
  })(),
  has_video: !!document.querySelector('article video, article [data-testid="videoPlayer"], article [data-testid="playButton"]'),
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
        
        # 提取作者和 handle：allText 结构通常是
        # [0]===ARTICLE 0=== [1]空 [2]作者名 [3]@handle
        # 逐行扫描，找名字行和 @handle 行
        if not data.get('author'):
            for i, line in enumerate(lines):
                if line.strip() and 'ARTICLE' not in line and not line.startswith('@'):
                    # 这是作者名
                    data['author'] = line.strip()
                    # 检查下一行是否 handle
                    if i + 1 < len(lines) and lines[i+1].strip().startswith('@'):
                        data['handle'] = lines[i+1].strip().lstrip('@')
                        data['authorLink'] = f"https://x.com/{data['handle']}"
                    break
            # 兜底：如果没找到名字，用原逻辑
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

# ====== Step 4.5: 先保存数据（防止图片下载崩溃丢数据） ======
batch = list(results.values())
with open(OUTPUT_PATH, "w") as f:
    json.dump(batch, f, ensure_ascii=False, indent=2)
print(f"💾 数据已保存: {len(results)} 条")

# ====== Step 5: 图片下载已移到 preprocess.py（过滤后下载，避免孤儿图片） ======
print("📝 图片将在预处理（过滤）后下载")

# ====== Step 6: 输出汇总 ======
batch = list(results.values())
with open("/tmp/tweets_batch.json", "w") as f:
    json.dump(batch, f, ensure_ascii=False, indent=2)

print(f"\n📊 采集完成: {len(results)}/{len(ids)} 条成功")
print(f"   数据: /tmp/tweets_batch.json")
print(f"   ⚠️ 图片未下载，等待 preprocess.py 过滤后下载")
