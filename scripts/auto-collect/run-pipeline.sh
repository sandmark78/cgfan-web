#!/bin/bash
# CGfan 自动采集完整流水线（no-agent 模式）
# 直接执行脚本，不依赖 LLM agent，避免超时问题

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_DIR="$SCRIPT_DIR/logs"
DATE=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$DATE-pipeline.log"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cd "$WORKSPACE"

log "========================================="
log "CGfan 自动采集流水线启动"
log "========================================="

# 阶段1: 检测+筛选
log ""
log "📥 阶段1/6: 检测活跃作者+筛选推文"
if python3 scripts/auto-collect/fetch-ids.py 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ 阶段1完成"
else
    log "❌ 阶段1失败"
    exit 1
fi

# 阶段2: 内容抓取
log ""
log "📥 阶段2/6: 抓取推文完整内容"
if python3 scripts/auto-collect/fetch-content.py 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ 阶段2完成"
else
    log "❌ 阶段2失败"
    exit 1
fi

# 阶段3: 预处理
log ""
log "📥 阶段3/6: 预处理（去重、过滤、提取图片URL）"
if python3 scripts/auto-collect/preprocess.py 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ 阶段3完成"
else
    log "❌ 阶段3失败"
    exit 1
fi

# 阶段4: LLM处理（核心步骤）
log ""
log "📥 阶段4/6: LLM处理（提取prompt、评分、生成标题、创建markdown）"
if python3 scripts/auto-collect/llm-process.py 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ 阶段4完成"
else
    log "❌ 阶段4失败"
    exit 1
fi

# 阶段5: 归档
log ""
log "📥 阶段5/6: 按日期归档"
if python3 scripts/auto-collect/archive-by-date.py 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ 阶段5完成"
else
    log "⚠️ 阶段5失败（非致命）"
fi

# 阶段6: 构建+部署
log ""
log "📥 阶段6/6: 构建+部署"
if npm run prebuild 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ prebuild完成"
else
    log "❌ prebuild失败"
    exit 1
fi

# 提交+推送
if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "auto: 自动采集 $DATE"
    if git push origin main 2>&1 | tee -a "$LOG_FILE"; then
        log "✅ 推送成功"
    else
        log "⚠️ 推送失败（重试一次）"
        sleep 5
        git push origin main 2>&1 | tee -a "$LOG_FILE" || true
    fi
else
    log "ℹ️ 无变更，跳过提交"
fi

# 生成报告
log ""
log "========================================="
log "📊 采集报告"
log "========================================="

if [ -f "data/auto-collect/llm-process-report.json" ]; then
    python3 -c "
import json
with open('data/auto-collect/llm-process-report.json') as f:
    r = json.load(f)
print(f'总计: {r[\"total\"]} 条')
print(f'过滤: {r[\"filtered\"]} 条')
print(f'低分: {r[\"low_score\"]} 条')
print(f'收录: {r[\"collected\"]} 条')
print()
if r.get('details'):
    collected = [d for d in r['details'] if d.get('status') == 'collected']
    if collected:
        print('收录明细:')
        for d in sorted(collected, key=lambda x: x.get('score', 0), reverse=True):
            print(f'  {d.get(\"score\", \"?\")}/80 | {d.get(\"title\", \"?\")[:20]} | {d.get(\"author\", \"?\")}')
" | tee -a "$LOG_FILE"
fi

log ""
log "✅ 流水线完成"
log "日志: $LOG_FILE"
