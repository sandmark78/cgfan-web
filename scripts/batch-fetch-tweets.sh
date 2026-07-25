#!/bin/bash
# batch-fetch-tweets.sh — 批量推文采集（并行优化版）
# 用法: bash scripts/batch-fetch-tweets.sh id1 id2 id3 ...
# 输出: /tmp/tweets_batch.json
# 图片: public/images/prompts/prompt-{id}.jpg

set -e
cd /Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web

IDS=("$@")
if [ ${#IDS[@]} -eq 0 ]; then
  echo "用法: $0 <tweet_id1> <tweet_id2> ..."
  exit 1
fi

# ====== Step 1: 清理旧 tab ======
echo "🧹 清理旧 tab..."
camofox get-tabs 2>/dev/null | grep -o 'tabId: [a-f0-9-]\{36\}' | awk '{print $2}' | while read tab; do
  camofox close "$tab" 2>/dev/null
done
sleep 1

# ====== Step 2: 并行开 tab ======
echo "🚀 并行打开 ${#IDS[@]} 个 tab..."
declare -A TABS
for id in "${IDS[@]}"; do
  camofox open "https://x.com/i/status/$id" > "/tmp/tab_${id}.txt" 2>&1 &
done
wait

# 解析 tab IDs
for id in "${IDS[@]}"; do
  tab=$(grep -o '[a-f0-9-]\{36\}' "/tmp/tab_${id}.txt" 2>/dev/null || echo "")
  if [ -n "$tab" ]; then
    TABS[$id]="$tab"
    echo "  ✅ $id → $tab"
  else
    echo "  ❌ $id 打开失败"
  fi
done

# ====== Step 3: 统一等待加载 ======
echo "⏳ 等待页面加载 (3s)..."
sleep 3

# ====== Step 4: 并行展开 + 提取 ======
echo "📥 并行提取内容..."
for id in "${IDS[@]}"; do
  tab="${TABS[$id]}"
  [ -z "$tab" ] && continue
  
  (
    # 展开长文本
    camofox eval 'document.querySelectorAll("button").forEach(btn => { if (btn.textContent.includes("Show more") || btn.textContent.includes("显示更多")) btn.click(); });' "$tab" > /dev/null 2>&1
    sleep 2
    
    # 一次性提取所有数据
    camofox eval 'JSON.stringify({
      allText: Array.from(document.querySelectorAll("article")).map((a,i) => "===ARTICLE " + i + "===\n" + a.innerText).join("\n\n"),
      imgs: Array.from(document.querySelectorAll("img")).filter(img => img.src.includes("pbs.twimg.com/media/")).map(img => img.src),
      author: (document.querySelector("article [data-testid=\"User-Name\"]") || {}).innerText?.split("\n")[0] || "",
      date: (() => { const t = document.querySelector("article time"); return t ? new Date(t.getAttribute("datetime")).toISOString().split("T")[0] : ""; })()
    })' "$tab" > "/tmp/tweet_${id}_raw.txt" 2>&1
  ) &
done
wait

# ====== Step 5: 并行关闭 tab ======
echo "🔒 并行关闭 tab..."
for id in "${IDS[@]}"; do
  tab="${TABS[$id]}"
  [ -z "$tab" ] && continue
  camofox close "$tab" > /dev/null 2>&1 &
done
wait

# ====== Step 6: 解析 + 并行下载图片 ======
echo "🖼️  解析数据 + 下载图片..."

# 先解析所有数据
declare -A AUTHORS DATES IMG_URLS IMG_COUNTS
for id in "${IDS[@]}"; do
  raw_file="/tmp/tweet_${id}_raw.txt"
  [ ! -f "$raw_file" ] && continue
  
  result_line=$(grep "^result:" "$raw_file" | sed 's/^result: //')
  [ -z "$result_line" ] && continue
  
  # 保存解析后的 JSON
  echo "$result_line" > "/tmp/tweet_${id}_data.json"
  
  # 提取字段
  AUTHORS[$id]=$(echo "$result_line" | python3 -c "import sys,json; print(json.load(sys.stdin).get('author',''))" 2>/dev/null || echo "")
  DATES[$id]=$(echo "$result_line" | python3 -c "import sys,json; print(json.load(sys.stdin).get('date',''))" 2>/dev/null || echo "")
  IMG_URLS[$id]=$(echo "$result_line" | python3 -c "import sys,json; d=json.load(sys.stdin); imgs=d.get('imgs',[]); print(imgs[0] if imgs else '')" 2>/dev/null || echo "")
  IMG_COUNTS[$id]=$(echo "$result_line" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('imgs',[])))" 2>/dev/null || echo "0")
done

# 并行下载图片
for id in "${IDS[@]}"; do
  img_url="${IMG_URLS[$id]}"
  [ -z "$img_url" ] && continue
  
  (
    clean_url="${img_url%%\?*}?format=jpg&name=orig"
    curl -s -L -H "User-Agent: Mozilla/5.0" -o "public/images/prompts/prompt-${id}.jpg" "$clean_url"
    # Safari 兼容修复
    sips -s format jpeg -s formatOptions best "public/images/prompts/prompt-${id}.jpg" --out "public/images/prompts/prompt-${id}.jpg" 2>/dev/null
  ) &
done
wait

# ====== Step 7: 生成汇总 JSON ======
echo "[" > /tmp/tweets_batch.json
FIRST=true
for id in "${IDS[@]}"; do
  data_file="/tmp/tweet_${id}_data.json"
  [ ! -f "$data_file" ] && continue
  
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo "," >> /tmp/tweets_batch.json
  fi
  
  python3 -c "
import json
d = json.load(open('$data_file'))
d['id'] = '$id'
json.dump(d, open('/dev/stdout','w'), ensure_ascii=False)
" >> /tmp/tweets_batch.json
done
echo "]" >> /tmp/tweets_batch.json

# ====== Step 8: 输出汇总 ======
echo ""
echo "📊 采集汇总:"
for id in "${IDS[@]}"; do
  data_file="/tmp/tweet_${id}_data.json"
  [ ! -f "$data_file" ] && continue
  
  author="${AUTHORS[$id]}"
  date="${DATES[$id]}"
  img_count="${IMG_COUNTS[$id]}"
  img_file="public/images/prompts/prompt-${id}.jpg"
  img_size=$(stat -f%z "$img_file" 2>/dev/null || echo 0)
  
  echo "  $id: 作者=$author | 日期=$date | 图片=${img_count}张/${img_size}B"
done

echo ""
echo "✅ 全部完成"
echo "   数据: /tmp/tweets_batch.json"
echo "   图片: public/images/prompts/prompt-{id}.jpg"
