#!/bin/bash
# 自动采集主脚本
# 每天运行一次

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🤖 CGfan 自动采集系统"
echo "===================="
echo ""

# 1. 抓取推文
echo "📥 步骤 1/2: 抓取推文"
python3 "$SCRIPT_DIR/fetch-tweets.py"

# 2. 处理提示词
echo ""
echo "🔧 步骤 2/2: 处理提示词"
python3 "$SCRIPT_DIR/process-prompts.py"

echo ""
echo "✅ 自动采集完成"
