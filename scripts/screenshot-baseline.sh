#!/bin/bash
# 移动端视觉基准截图
# 用法：./scripts/screenshot-baseline.sh
# 截图保存到 docs/screenshots/baseline/

set -e

BASELINE_DIR="docs/screenshots/baseline"
mkdir -p "$BASELINE_DIR"

echo "📸 截取移动端基准截图..."
echo "   设备：iPhone 14 Pro (390×844)"
echo ""

# 关键页面
declare -A PAGES=(
  ["/"]="home"
  ["/explore"]="explore"
  ["/prompt/prompt-2078116052224131219"]="detail"
  ["/taste"]="taste"
  ["/subscribe"]="subscribe"
)

for page in "${!PAGES[@]}"; do
  filename="${PAGES[$page]}"
  outfile="$BASELINE_DIR/${filename}.png"
  
  echo "  → $page → ${filename}.png"
  
  # 打开页面
  tab=$(camofox open "https://www.cgfan.com${page}" --viewport 390x844 2>/dev/null | grep -oE '[0-9]+' | head -1)
  
  if [ -n "$tab" ]; then
    # 等待加载
    sleep 2
    # 截图
    camofox screenshot "$tab" --output "$outfile" 2>/dev/null
    # 关闭标签
    camofox close "$tab" 2>/dev/null
    echo "    ✓ 已保存"
  else
    echo "    ⚠️  失败"
  fi
done

echo ""
echo "✅ 完成！截图保存在 $BASELINE_DIR/"
echo "   对比方法：git diff 查看图片变化，或用 VS Code 对比"
