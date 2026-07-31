#!/bin/bash
# 自动采集主脚本
# 每天运行一次

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🤖 CGfan 自动采集系统"
echo "===================="
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd "$WORKSPACE_DIR"

# 1. 抓取推文
echo "📥 步骤 1/2: 抓取作者最新推文"
python3 "$SCRIPT_DIR/fetch-tweets.py"

# 检查是否有新推文
if [ ! -f "/tmp/tweets_batch.json" ]; then
    echo "⚠️  没有找到采集数据，流程结束"
    exit 0
fi

# 2. 处理提示词
echo ""
echo "🔧 步骤 2/2: 处理提示词"
python3 "$SCRIPT_DIR/process-prompts.py"

echo ""
echo "✅ 自动采集完成"
echo "结束时间: $(date '+%Y-%m-%d %H:%M:%S')"
