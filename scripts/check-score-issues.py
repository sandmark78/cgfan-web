#!/usr/bin/env python3
"""
检查评分问题
"""
import re
from pathlib import Path

def check_scores():
    issues = []
    
    for md_file in Path('content/prompts').rglob('*.md'):
        content = md_file.read_text()
        
        # 提取评分字段
        score_match = re.search(r'^score:\s*([\d.]+)(?:/80)?', content, re.MULTILINE)
        if not score_match:
            continue
        
        score = float(score_match.group(1))
        
        # 提取8个维度
        dimensions = {}
        for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
            match = re.search(rf'^{dim}:\s*([\d.]+)(?:/10)?', content, re.MULTILINE)
            if match:
                dimensions[dim] = float(match.group(1))
        
        if len(dimensions) != 8:
            issues.append({
                'file': md_file,
                'issue': 'missing_dimensions',
                'score': score,
                'dimensions': dimensions
            })
            continue
        
        # 检查问题
        dim_values = list(dimensions.values())
        sum_dims = sum(dim_values)
        ten_count = sum(1 for v in dim_values if v >= 10)
        min_dim = min(dim_values)
        
        # 问题1：总分计算错误
        if abs(sum_dims - score) > 0.1:
            issues.append({
                'file': md_file,
                'issue': 'wrong_sum',
                'score': score,
                'sum': sum_dims,
                'dimensions': dimensions
            })
        
        # 问题2：多个10分
        if ten_count > 1:
            issues.append({
                'file': md_file,
                'issue': 'multiple_tens',
                'score': score,
                'ten_count': ten_count,
                'dimensions': dimensions
            })
        
        # 问题3：所有维度都>=8（评分太松）
        if min_dim >= 8:
            issues.append({
                'file': md_file,
                'issue': 'too_generous',
                'score': score,
                'min_dim': min_dim,
                'dimensions': dimensions
            })
        
        # 问题4：总分>72但非前所未见
        if score > 72:
            issues.append({
                'file': md_file,
                'issue': 'too_high',
                'score': score,
                'dimensions': dimensions
            })
    
    return issues

def main():
    issues = check_scores()
    
    print(f"发现 {len(issues)} 个评分问题\n")
    
    # 按问题类型分组
    by_type = {}
    for issue in issues:
        t = issue['issue']
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(issue)
    
    for issue_type, items in by_type.items():
        print(f"=== {issue_type} ({len(items)}个) ===")
        for item in items[:10]:  # 只显示前10个
            print(f"  {item['file']}")
            print(f"    总分: {item.get('score')}")
            if 'sum' in item:
                print(f"    维度之和: {item['sum']}")
            if 'ten_count' in item:
                print(f"    10分数量: {item['ten_count']}")
            if 'min_dim' in item:
                print(f"    最低维度: {item['min_dim']}")
            dims = item.get('dimensions', {})
            dims_str = ', '.join(f"{k}={v}" for k, v in dims.items())
            print(f"    维度: {dims_str}")
            print()
        if len(items) > 10:
            print(f"  ... 还有 {len(items) - 10} 个\n")

if __name__ == '__main__':
    main()
