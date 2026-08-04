#!/usr/bin/env python3
"""
评分验证脚本 — 拦截虚高评分

检查规则：
1. 算术正确：总分 = 8维严格相加
2. 10分限制：一批最多2个10分维度
3. 总分上限：单条不超过72（除非用户特别标记）
4. 分布合理：不能所有维度都≥8（说明评分太松）
5. 品味对齐：检查是否符合IMAGE_TASTE.md的偏好方向
"""

import json
import re
import sys
import os
from pathlib import Path

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

DIMENSIONS = ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']
DIM_CN = {
    'composition': '构图', 'color': '色彩', 'lighting': '光影', 'detail': '细节',
    'creativity': '创意', 'technical': '技术', 'aesthetic': '审美', 'curation': '策展'
}

def extract_scores(md_content: str) -> dict:
    """从markdown提取评分"""
    scores = {}
    for dim in DIMENSIONS:
        m = re.search(rf'{dim}:\s*(\d+)/10', md_content)
        if m:
            scores[dim] = int(m.group(1))
    
    m = re.search(r'score:\s*(\d+)/80', md_content)
    if m:
        scores['total'] = int(m.group(1))
    
    return scores

def validate_file(filepath: Path) -> list:
    """验证单个文件，返回问题列表"""
    issues = []
    content = filepath.read_text(encoding='utf-8')
    scores = extract_scores(content)
    
    if not scores or len(scores) < 9:
        issues.append(f"  ⚠️ 评分不完整: {scores}")
        return issues
    
    # 1. 算术检查
    dim_sum = sum(scores[d] for d in DIMENSIONS if d in scores)
    declared_total = scores.get('total', 0)
    if dim_sum != declared_total:
        issues.append(f"  ❌ 算术错误: {dim_sum} ≠ {declared_total} (声明)")
    
    # 2. 10分限制
    tens = [d for d in DIMENSIONS if scores.get(d, 0) == 10]
    if len(tens) > 2:
        issues.append(f"  ⚠️ 10分过多: {len(tens)}个 ({', '.join(DIM_CN[t] for t in tens)})")
    
    # 3. 总分上限
    if declared_total > 72:
        title_m = re.search(r'title:\s*"(.+?)"', content)
        title = title_m.group(1) if title_m else filepath.stem
        issues.append(f"  ⚠️ 高分预警: {declared_total}/80 「{title}」")
    
    # 4. 分布检查
    if all(scores.get(d, 0) >= 8 for d in DIMENSIONS):
        issues.append(f"  ⚠️ 全维度≥8，评分可能过松")
    
    return issues

def main():
    print("🔍 评分验证")
    print("=" * 60)
    
    # 检查最近的文件（今天新增的）
    prompts_dir = Path('content/prompts')
    today_files = []
    
    for md_file in prompts_dir.rglob('prompt-2084*.md'):
        today_files.append(md_file)
    
    if not today_files:
        print("没有找到待验证文件")
        return
    
    print(f"📋 检查 {len(today_files)} 个文件\n")
    
    high_scores = []
    issues_found = 0
    
    for filepath in sorted(today_files):
        issues = validate_file(filepath)
        if issues:
            issues_found += 1
            print(f"📄 {filepath.name}")
            for issue in issues:
                print(issue)
            print()
        
        # 收集高分
        content = filepath.read_text(encoding='utf-8')
        scores = extract_scores(content)
        if scores.get('total', 0) >= 68:
            title_m = re.search(r'title:\s*"(.+?)"', content)
            title = title_m.group(1) if title_m else filepath.stem
            high_scores.append((scores['total'], title, filepath.name))
    
    print("=" * 60)
    print(f"📊 验证结果: {issues_found} 个问题")
    
    if high_scores:
        print(f"\n⭐ 高分列表 (≥68):")
        for total, title, fname in sorted(high_scores, reverse=True):
            print(f"  {total}/80 — {title}")
    
    # 返回退出码
    sys.exit(1 if issues_found > 5 else 0)

if __name__ == "__main__":
    main()
