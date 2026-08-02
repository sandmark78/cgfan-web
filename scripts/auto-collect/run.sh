#!/bin/bash
# 自动采集主脚本 — 混合处理版（脚本格式清理 + LLM语义处理）
# 每天运行一次，带日志持久化、重试、结果通知

set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_DIR="$SCRIPT_DIR/logs"
DATE=$(date '+%Y-%m-%d')
LOG_FILE="$LOG_DIR/$DATE.log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数：同时输出到终端和文件
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

# 清理30天前的日志
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null

log "🤖 CGfan 自动采集系统 (混合处理版)"
log "========================"
log "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
log "日志文件: $LOG_FILE"
log ""

cd "$WORKSPACE_DIR"

# ====== 步骤 1: 抓取推文（带重试） ======
log "📥 步骤 1/3: 抓取作者最新推文"
FETCH_OK=false
for attempt in 1 2 3; do
    log "  尝试 $attempt/3..."
    if python3 -c "
import subprocess, sys
try:
    result = subprocess.run(['python3', '$SCRIPT_DIR/fetch-tweets.py'], timeout=600, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
except subprocess.TimeoutExpired:
    print('❌ 抓取超时', file=sys.stderr)
    sys.exit(1)
" >> "$LOG_FILE" 2>&1; then
        FETCH_OK=true
        break
    else
        log "  ⚠️ 尝试 $attempt 失败，等待 ${attempt}0 秒后重试..."
        sleep $((attempt * 10))
    fi
done

if [ "$FETCH_OK" != "true" ]; then
    log "❌ 抓取失败（3次重试后放弃）"
    python3 "$SCRIPT_DIR/notify.py" --status fail --step fetch --log "$LOG_FILE"
    exit 1
fi

# 检查是否有新推文
if [ ! -f "/tmp/tweets_batch.json" ]; then
    log "⚠️  没有找到采集数据，流程结束"
    python3 "$SCRIPT_DIR/notify.py" --status empty --log "$LOG_FILE"
    exit 0
fi

# ====== 步骤 2: 混合处理（脚本格式清理 + LLM语义处理） ======
log ""
log "🔧 步骤 2/3: 混合处理提示词（脚本 + LLM）"
PROCESS_OK=false
for attempt in 1 2; do
    log "  尝试 $attempt/2..."
    if python3 -c "
import subprocess, sys
try:
    result = subprocess.run(['python3', '$SCRIPT_DIR/process-prompts-hybrid.py'], timeout=600, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
except subprocess.TimeoutExpired:
    print('❌ 处理超时', file=sys.stderr)
    sys.exit(1)
" >> "$LOG_FILE" 2>&1; then
        PROCESS_OK=true
        break
    else
        log "  ⚠️ 尝试 $attempt 失败"
        sleep 5
    fi
done

if [ "$PROCESS_OK" != "true" ]; then
    log "❌ 混合处理失败（2次重试后放弃）"
    python3 "$SCRIPT_DIR/notify.py" --status fail --step process --log "$LOG_FILE"
    exit 1
fi

# 检查是否有处理结果
if [ ! -f "/tmp/llm_processed.json" ]; then
    log "⚠️  没有生成处理结果，流程结束"
    python3 "$SCRIPT_DIR/notify.py" --status empty --log "$LOG_FILE"
    exit 0
fi

# ====== 步骤 3: 生成markdown文件并部署 ======
log ""
log "📝 步骤 3/3: 生成markdown文件并部署"
DEPLOY_OK=false
if python3 -c "
import subprocess, sys
try:
    result = subprocess.run(['python3', '$SCRIPT_DIR/generate-markdown.py'], timeout=300, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
except subprocess.TimeoutExpired:
    print('❌ 生成超时', file=sys.stderr)
    sys.exit(1)
" >> "$LOG_FILE" 2>&1; then
    DEPLOY_OK=true
fi

if [ "$DEPLOY_OK" != "true" ]; then
    log "❌ 生成markdown失败"
    python3 "$SCRIPT_DIR/notify.py" --status fail --step deploy --log "$LOG_FILE"
    exit 1
fi

log ""
log "✅ 自动采集完成"
log "结束时间: $(date '+%Y-%m-%d %H:%M:%S')"

# 发送成功通知（附带统计摘要）
python3 "$SCRIPT_DIR/notify.py" --status ok --log "$LOG_FILE"
