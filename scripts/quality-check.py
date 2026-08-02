#!/usr/bin/env python3
"""
自动化流程质量保证脚本

检查：
1. 采集的 prompt 是否干净（无作者信息、日期、互动数据）
2. 标题是否有意义（不是"AI视觉创作"这种泛称）
3. 标签是否完整（至少3个）
4. 评分是否正确（总分 = 8维度相加）
5. 每日一味策展笔记是否模板化
6. 邮件发送是否成功
"""

import json
import re
from pathlib import Path
from datetime import datetime, timedelta

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"

def check_prompt_quality():
    """检查最近采集的 prompt 质量"""
    print("🔍 检查采集质量...")
    
    prompts_dir = Path(WORKDIR) / "content/prompts"
    issues = []
    
    # 检查最近7天的文件
    cutoff = datetime.now() - timedelta(days=7)
    
    for md_file in prompts_dir.rglob("prompt-*.md"):
        mtime = datetime.fromtimestamp(md_file.stat().st_mtime)
        if mtime < cutoff:
            continue
        
        content = md_file.read_text()
        
        # 提取 frontmatter
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not fm_match:
            issues.append(f"❌ {md_file.name}: 缺少 frontmatter")
            continue
        
        fm_text = fm_match.group(1)
        
        # 检查必需字段
        required_fields = ['title', 'slug', 'tags', 'category', 'model', 'cover', 'source']
        for field in required_fields:
            if f'{field}:' not in fm_text:
                issues.append(f"⚠️ {md_file.name}: 缺少 {field} 字段")
        
        # 检查标题质量
        title_match = re.search(r'title:\s*["\'](.+?)["\']', fm_text)
        if title_match:
            title = title_match.group(1)
            bad_titles = ['AI视觉创作', '创意视觉', '风格海报', '视觉创作']
            if any(bad in title for bad in bad_titles):
                issues.append(f"❌ {md_file.name}: 标题质量差 - '{title}'")
        
        # 检查标签
        tags_match = re.search(r'tags:\s*\[(.*?)\]', fm_text)
        if tags_match:
            tags_text = tags_match.group(1)
            tag_count = len([t for t in tags_text.split(',') if t.strip()])
            if tag_count < 3:
                issues.append(f"⚠️ {md_file.name}: 标签太少 - 只有 {tag_count} 个")
        
        # 检查评分
        score_match = re.search(r'score:\s*(\d+)/80', fm_text)
        if score_match:
            total = int(score_match.group(1))
            
            # 提取8维度分数
            dims = {}
            for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
                dim_match = re.search(rf'{dim}:\s*(\d+(?:\.\d+)?)/10', fm_text)
                if dim_match:
                    dims[dim] = float(dim_match.group(1))
            
            # 验证总分
            if dims:
                calculated = sum(dims.values())
                if abs(calculated - total) > 1:
                    issues.append(f"❌ {md_file.name}: 评分错误 - 总分 {total} 但维度相加是 {calculated}")
        
        # 检查 prompt 内容是否干净
        prompt_section = content.split('## Prompt\n\n```')[-1].split('```')[0]
        if prompt_section:
            # 检查是否包含作者信息
            if re.search(r'@[a-zA-Z0-9_]+', prompt_section):
                issues.append(f"⚠️ {md_file.name}: prompt 包含 @handle")
            
            # 检查是否包含日期
            if re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b', prompt_section):
                issues.append(f"⚠️ {md_file.name}: prompt 包含日期")
            
            # 检查是否包含互动数据
            if re.search(r'\b\d+\s*\n\s*\d+\s*\n\s*[\d,.]+[KMB]?\b', prompt_section):
                issues.append(f"⚠️ {md_file.name}: prompt 包含互动数据")
    
    if issues:
        print(f"发现 {len(issues)} 个问题:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ 所有文件质量合格")
    
    return len(issues) == 0

def check_daily_feature_quality():
    """检查每日一味质量"""
    print("\n🔍 检查每日一味质量...")
    
    daily_file = Path(WORKDIR) / "lib/daily-feature.ts"
    content = daily_file.read_text()
    
    issues = []
    
    # 提取所有条目
    entries = re.findall(r'date:\s*\'([^\']+)\'.*?slug:\s*\'([^\']+)\'.*?curatorNote:\s*\'([^\']+)\'', content, re.DOTALL)
    
    for date, slug, note in entries[-5:]:  # 检查最近5条
        # 检查策展笔记是否模板化
        template_phrases = [
            '这个提示词展示了',
            '重点在于',
            '关键在于',
            '主要特点是'
        ]
        
        if any(phrase in note for phrase in template_phrases):
            issues.append(f"⚠️ {date}: 策展笔记可能模板化 - '{note[:50]}...'")
        
        # 检查笔记长度
        if len(note) < 100:
            issues.append(f"⚠️ {date}: 策展笔记太短 - 只有 {len(note)} 字符")
    
    if issues:
        print(f"发现 {len(issues)} 个问题:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ 每日一味质量合格")
    
    return len(issues) == 0

def check_email_delivery():
    """检查邮件发送状态"""
    print("\n🔍 检查邮件发送状态...")
    
    # 读取 Supabase 日志（需要 API key）
    # 这里只检查脚本是否存在
    email_script = Path(WORKDIR) / "scripts/send-daily-email.mjs"
    
    if not email_script.exists():
        print("❌ 邮件发送脚本不存在")
        return False
    
    # 检查环境变量（从 .env.local 读取）
    env_file = Path(WORKDIR) / ".env.local"
    if not env_file.exists():
        print("⚠️ 缺少 .env.local 文件")
        return False
    
    env_content = env_file.read_text()
    required_vars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']
    missing = []
    
    for var in required_vars:
        if f'{var}=' not in env_content:
            missing.append(var)
    
    if missing:
        print(f"⚠️ 缺少环境变量: {', '.join(missing)}")
        return False
    
    print("✅ 邮件发送配置正确")
    return True

def main():
    print("=" * 60)
    print("自动化流程质量保证检查")
    print("=" * 60)
    
    results = []
    
    results.append(("采集质量", check_prompt_quality()))
    results.append(("每日一味质量", check_daily_feature_quality()))
    results.append(("邮件发送配置", check_email_delivery()))
    
    print("\n" + "=" * 60)
    print("检查结果汇总:")
    print("=" * 60)
    
    for name, passed in results:
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"{name}: {status}")
    
    all_passed = all(passed for _, passed in results)
    
    if not all_passed:
        print("\n⚠️ 存在问题，请检查并修复")
        return 1
    
    print("\n✅ 所有检查通过")
    return 0

if __name__ == "__main__":
    exit(main())
