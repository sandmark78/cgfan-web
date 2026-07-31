#!/bin/bash
# 自动采集主脚本
# 每天运行一次

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo "🤖 CGfan 自动采集系统"
echo "===================="
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd "$WORKSPACE_DIR"

# 1. 抓取推文（使用Python timeout）
echo "📥 步骤 1/2: 抓取作者最新推文"
python3 -c "
import subprocess, sys
try:
    subprocess.run(['python3', '$SCRIPT_DIR/fetch-tweets.py'], timeout=600)
except subprocess.TimeoutExpired:
    print('❌ 抓取超时')
    sys.exit(1)
"

# 检查是否有新推文
if [ ! -f "/tmp/tweets_batch.json" ]; then
    echo "⚠️  没有找到采集数据，流程结束"
    exit 0
fi

# 2. 处理提示词
echo ""
echo "🔧 步骤 2/2: 处理提示词"
python3 -c "
import subprocess, sys
try:
    subprocess.run(['python3', '$SCRIPT_DIR/process-prompts.py'], timeout=300)
except subprocess.TimeoutExpired:
    print('❌ 处理超时')
    sys.exit(1)
"

echo ""
echo "✅ 自动采集完成"
echo "结束时间: $(date '+%Y-%m-%d %H:%M:%S')"