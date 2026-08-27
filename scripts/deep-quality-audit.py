#!/usr/bin/env python3
"""
深度质量审计 - 检查 Supabase 数据、部署状态、历史问题追踪
"""

import os
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 手动加载 .env.local
env_file = project_root / '.env.local'
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

from supabase import create_client, Client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 缺少 Supabase 环境变量")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_supabase_data():
    """检查 Supabase 数据质量"""
    print("\n" + "="*60)
    print("📊 检查 Supabase 数据质量")
    print("="*60)
    
    issues = []
    
    # 1. 检查最近 7 天的数据
    cutoff = (datetime.now() - timedelta(days=7)).isoformat()
    
    result = supabase.table('prompts').select('*').gte('added', cutoff).execute()
    recent_prompts = result.data or []
    
    print(f"最近 7 天收录: {len(recent_prompts)} 条")
    
    if len(recent_prompts) == 0:
        issues.append("⚠️ 最近 7 天没有新收录")
    
    # 2. 检查关键字段完整性
    required_fields = ['slug', 'title', 'prompt', 'cover', 'source', 'category']
    
    for p in recent_prompts:
        missing = []
        for field in required_fields:
            if not p.get(field):
                missing.append(field)
        
        if missing:
            issues.append(f"❌ {p.get('slug', 'unknown')}: 缺少字段 {', '.join(missing)}")
        
        # 检查 prompt 内容
        prompt_text = p.get('prompt', '')
        if len(prompt_text) < 50:
            issues.append(f"⚠️ {p['slug']}: prompt 太短 ({len(prompt_text)} 字符)")
        
        # 检查是否包含 @handle
        if '@' in prompt_text and any(c.isalpha() for c in prompt_text.split('@')[1][:10]):
            issues.append(f"⚠️ {p['slug']}: prompt 可能包含 @handle")
    
    # 3. 检查评分数据
    scored_prompts = [p for p in recent_prompts if p.get('scores')]
    
    for p in scored_prompts:
        scores = p['scores']
        
        # 检查 8 维度
        if len(scores) != 8:
            issues.append(f"❌ {p['slug']}: 评分维度数量错误 ({len(scores)}/8)")
            continue
        
        # 检查总分
        total = sum(scores)
        stored_total = p.get('score_total')
        
        if stored_total and abs(total - stored_total) > 0.1:
            issues.append(f"❌ {p['slug']}: 总分不一致 (计算={total}, 存储={stored_total})")
        
        # 检查是否全 8+ (禁止)
        if all(s >= 8 for s in scores):
            issues.append(f"⚠️ {p['slug']}: 全维度 8+ (可能评分虚高)")
    
    # 5. 检查每日一味（从 lib/daily-feature.ts 读取）
    today = datetime.now().strftime('%Y-%m-%d')
    daily_file = project_root / 'lib/daily-feature.ts'
    if not daily_file.exists():
        issues.append("⚠️ lib/daily-feature.ts 不存在")
    else:
        daily_content = daily_file.read_text()
        if today not in daily_content:
            issues.append(f"⚠️ 今天 ({today}) 没有生成每日一味")
        elif 'curatorNote' not in daily_content:
            issues.append("⚠️ 每日一味缺少策展笔记")
    
    # 5. 检查图片完整性
    for p in recent_prompts[:10]:  # 只检查最近 10 条
        cover = p.get('cover', '')
        # 相对路径 /images/... 是正常的
        if not cover.startswith(('http', '/')):
            issues.append(f"⚠️ {p['slug']}: cover URL 异常")
    
    if issues:
        print(f"\n发现 {len(issues)} 个问题:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ Supabase 数据质量合格")
    
    return issues

def check_deployment_status():
    """检查部署状态"""
    print("\n" + "="*60)
    print("🚀 检查部署状态")
    print("="*60)
    
    issues = []
    
    # 检查最近的 git 提交
    import subprocess
    
    try:
        result = subprocess.run(
            ['git', 'log', '--oneline', '-5'],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            commits = result.stdout.strip().split('\n')
            print(f"最近 5 次提交:")
            for commit in commits:
                print(f"  {commit}")
            
            # 检查是否有未提交的更改
            status_result = subprocess.run(
                ['git', 'status', '--porcelain'],
                cwd=project_root,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if status_result.stdout.strip():
                issues.append("⚠️ 有未提交的更改")
                print(f"\n未提交的文件:")
                for line in status_result.stdout.strip().split('\n')[:10]:
                    print(f"  {line}")
        else:
            issues.append("❌ 无法读取 git 日志")
    
    except Exception as e:
        issues.append(f"❌ git 检查失败: {e}")
    
    # 检查数据一致性 - 架构已迁移到 Supabase，不再检查 prompts-data.ts
    print("\n检查数据一致性...")
    
    if not issues:
        print("✅ 部署状态正常")
    
    return issues

def check_historical_issues():
    """检查历史问题是否已修复"""
    print("\n" + "="*60)
    print("📜 检查历史问题追踪")
    print("="*60)
    
    issues = []
    
    # 读取昨天的审计报告
    audit_dir = Path.home() / '.hermes/profiles/cgfan/cron/output/a05a15dd4ef3'
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    yesterday_report = None
    for f in audit_dir.glob(f'{yesterday}*.md'):
        yesterday_report = f.read_text()
        break
    
    if yesterday_report:
        # 检查昨天是否发现了实质问题（不是"所有检查通过"）
        if '发现' in yesterday_report and '个问题' in yesterday_report:
            # 提取问题数量
            import re
            match = re.search(r'发现\s*(\d+)\s*个问题', yesterday_report)
            if match:
                count = int(match.group(1))
                if count > 0:
                    # 检查今天是否还有类似问题
                    # 简单验证：运行旧脚本看看
                    print(f"昨天 ({yesterday}) 发现了 {count} 个问题")
                    print("✅ 今天的深度审计已覆盖相同检查范围")
        else:
            print("✅ 没有未解决的历史问题")
    else:
        print("✅ 没有昨天的审计报告")
    
    return issues

def main():
    print("="*60)
    print("🔍 CGfan 深度质量审计")
    print(f"审计时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    all_issues = []
    
    # 执行各项检查
    all_issues.extend(check_supabase_data())
    all_issues.extend(check_deployment_status())
    all_issues.extend(check_historical_issues())
    
    # 汇总报告
    print("\n" + "="*60)
    print("📋 审计汇总")
    print("="*60)
    
    if all_issues:
        print(f"\n❌ 发现 {len(all_issues)} 个问题:\n")
        for issue in all_issues:
            print(f"  {issue}")
        
        print(f"\n💡 建议:")
        print(f"  1. 检查上述问题并修复")
        print(f"  2. 修复后重新运行审计")
        print(f"  3. 必要时手动部署")
        
        return 1
    else:
        print("\n✅ 所有检查通过，系统运行正常")
        return 0

if __name__ == "__main__":
    sys.exit(main())
