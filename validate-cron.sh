#!/bin/bash
# CGfan 自动采集验证脚本
# 用于 cron job 执行每日校验

set -e

WORKDIR="/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
cd "$WORKDIR"

echo "🔍 CGfan 校验报告 ($(date +%Y-%m-%d))"
echo ""

# 1. 图片完整性检查
echo "1. 图片完整性检查..."
python3 scripts/check-images.py 2>&1 | tail -10

# 2. 采集数据统计
echo ""
echo "2. 采集数据统计..."
python3 << 'PYEOF'
import json
import os
import sys
sys.path.insert(0, 'scripts')

# 加载环境变量
with open('.env.local') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            os.environ[k] = v

from supabase_utils import get_client

# 预处理数据
preprocessed = json.load(open('data/auto-collect/preprocessed.json'))
print(f"📦 预处理队列: {len(preprocessed)} 条")

# 检查最近日期
dates = set()
for item in preprocessed:
    if 'date' in item:
        dates.add(item['date'])
if dates:
    print(f"   日期范围: {min(dates)} ~ {max(dates)}")

# Supabase 统计
sb = get_client()
today = '2026-09-24'
result = sb.table('prompts').select('slug').gte('added', today).lte('added', today + 'T23:59:59').execute()
print(f"✅ 今日收录: {len(result.data)} 条")

total = sb.table('prompts').select('id', count='exact').execute()
print(f"📊 总计: {total.count} 条")
PYEOF

# 3. 质量检查
echo ""
echo "3. 质量检查..."
python3 scripts/check-quality.py 2>&1 | head -30

# 4. 部署验证
echo ""
echo "4. 部署验证..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://www.cgfan.com/explore)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 网站访问正常 (HTTP $HTTP_CODE)"
else
    echo "✗ 网站访问异常 (HTTP $HTTP_CODE)"
fi

# 5. 抽查详情页
echo ""
echo "5. 抽查详情页..."
python3 << 'PYEOF'
import json
import random
import os
import sys
sys.path.insert(0, 'scripts')

with open('.env.local') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            os.environ[k] = v

from supabase_utils import get_client
sb = get_client()

# 随机抽取 3 个今日条目
today = '2026-09-24'
result = sb.table('prompts').select('slug,title').gte('added', today).lte('added', today + 'T23:59:59').execute()

if len(result.data) >= 3:
    samples = random.sample(result.data, 3)
    for s in samples:
        print(f"  ✓ {s['slug'][:50]}")
else:
    print(f"  今日条目不足 3 个，跳过抽查")
PYEOF

echo ""
echo "✓ 校验完成"
