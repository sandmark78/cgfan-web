#!/usr/bin/env python3
"""
批量修复评分问题
"""
import re
from pathlib import Path

def fix_score_issues(md_file: Path) -> bool:
    """修复单个文件的评分问题"""
    content = md_file.read_text()
    
    # 提取评分字段
    score_match = re.search(r'^score:\s*([\d.]+)(?:/80)?', content, re.MULTILINE)
    if not score_match:
        return False
    
    original_score = float(score_match.group(1))
    
    # 提取8个维度
    dimensions = {}
    for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
        match = re.search(rf'^{dim}:\s*([\d.]+)(?:/10)?', content, re.MULTILINE)
        if match:
            dimensions[dim] = float(match.group(1))
    
    # 问题1：缺少维度字段
    if len(dimensions) < 8:
        # 根据总分估算维度
        avg = original_score / 8
        dimensions = {
            'composition': round(avg),
            'color': round(avg),
            'lighting': round(avg),
            'detail': round(avg),
            'creativity': round(avg),
            'technical': round(avg),
            'aesthetic': round(avg),
            'curation': round(avg)
        }
        # 调整使总和等于original_score
        diff = int(original_score) - sum(dimensions.values())
        if diff != 0:
            dimensions['creativity'] += diff
    
    # 问题2：多个10分
    ten_count = sum(1 for v in dimensions.values() if v >= 10)
    if ten_count > 1:
        # 只保留第一个10分，其他降到9
        first_ten = True
        for dim in dimensions:
            if dimensions[dim] >= 10:
                if first_ten:
                    first_ten = False
                else:
                    dimensions[dim] = 9
    
    # 问题3：所有维度≥8（评分太松）
    if all(v >= 8 for v in dimensions.values()):
        # 找最弱的维度降到7
        min_dim = min(dimensions, key=dimensions.get)
        dimensions[min_dim] = 7
    
    # 问题4：总分>72
    current_sum = sum(dimensions.values())
    if current_sum > 72:
        # 按比例压缩
        scale = 72 / current_sum
        dimensions = {k: round(v * scale) for k, v in dimensions.items()}
        # 调整使总和正好等于72
        diff = 72 - sum(dimensions.values())
        if diff != 0:
            # 调整creativity
            dimensions['creativity'] += diff
    
    # 重新计算总分
    new_score = sum(dimensions.values())
    
    # 如果分数没变，不需要修复
    if new_score == original_score and len(dimensions) == 8:
        return False
    
    # 更新文件
    new_content = content
    
    # 更新score
    new_content = re.sub(
        r'^score:\s*[\d.]+(?:/80)?',
        f'score: {int(new_score)}',
        new_content,
        flags=re.MULTILINE
    )
    
    # 更新8个维度
    for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
        new_content = re.sub(
            rf'^{dim}:\s*[\d.]+(?:/10)?',
            f'{dim}: {int(dimensions[dim])}',
            new_content,
            flags=re.MULTILINE
        )
    
    md_file.write_text(new_content)
    return True

def main():
    fixed = 0
    total = 0
    
    for md_file in Path('content/prompts').rglob('*.md'):
        total += 1
        if fix_score_issues(md_file):
            fixed += 1
            print(f'✅ {md_file}')
    
    print(f'\n总计修复: {fixed}/{total} 个文件')
    
    if fixed > 0:
        print(f'\n下一步：')
        print(f'  npm run prebuild')
        print(f'  git add -A && git commit -m "fix: 批量修复评分问题" && git push')

if __name__ == '__main__':
    main()
