#!/bin/bash
# 移动端视觉基准截图
# 用法：./scripts/screenshot-baseline.sh
# 截图保存到 docs/screenshots/baseline/

BASELINE_DIR="docs/screenshots/baseline"
mkdir -p "$BASELINE_DIR"

echo "📸 截取移动端基准截图..."
echo "   设备：iPhone 14 Pro (390×844)"
echo ""

# 依次截图
take_shot() {
  local name="$1"
  local path="$2"
  local url="https://www.cgfan.com${path}"
  local outfile="$BASELINE_DIR/${name}.png"
  
  echo "  → ${name} (${path})"
  camofox open "$url" --viewport 390x844 > /dev/null 2>&1
  sleep 3
  camofox screenshot --output "$outfile" > /dev/null 2>&1
  camofox close > /dev/null 2>&1
  
  if [ -f "$outfile" ]; then
    echo "    ✓ $(basename $outfile)"
  else
    echo "    ✗ 失败"
  fi
}

take_shot "home" "/"
take_shot "explore" "/explore"
take_shot "detail" "/prompt/prompt-2078116052224131219"
take_shot "taste" "/taste"
take_shot "subscribe" "/subscribe"

echo ""
ls -lh "$BASELINE_DIR"/*.png 2>/dev/null || echo "⚠️  没有截图生成"
echo ""
echo "对比方法：修改前后各跑一次，git diff 看图片变化"
