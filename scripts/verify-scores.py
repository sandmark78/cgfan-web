#!/usr/bin/env python3
"""
评分验证脚本
检查 IMAGE_TASTE.md 中所有评分记录的总分是否正确（= 8维度相加）

使用方法：
  python3 scripts/verify-scores.py

返回值：
  0 - 所有评分正确
  1 - 发现计算错误
"""

import re
import sys
from pathlib import Path

def verify_scores():
    """验证 IMAGE_TASTE.md 中的所有评分记录"""
    
    taste_file = Path('docs/IMAGE_TASTE.md')
    
    if not taste_file.exists():
        print(f"❌ 文件不存在: {taste_file}")
        return False
    
    with open(taste_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配评分表格行
    # 格式: | # | 图片 | 作者 | 构图 | 色彩 | 光影 | 细节 | 创意 | 技术 | 审美 | 策展 | 总分/80 |
    pattern = r'\| (\d+) \| ([^|]+) \| ([^|]+) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?) \| (\d+(?:\.\d+)?)/80 \|'
    
    matches = re.findall(pattern, content)
    
    if not matches:
        print("⚠️  未找到评分记录")
        return True
    
    errors = []
    
    for m in matches:
        num = int(m[0])
        name = m[1].strip()
        author = m[2].strip()
        scores = [float(m[i]) for i in range(3, 11)]  # 8个维度
        recorded_total = float(m[11])
        
        # 计算实际总分
        actual_total = sum(scores)
        
        # 检查是否匹配（允许 0.1 的浮点误差）
        if abs(actual_total - recorded_total) > 0.1:
            errors.append({
                'num': num,
                'name': name,
                'author': author,
                'scores': scores,
                'recorded': recorded_total,
                'actual': actual_total,
                'diff': actual_total - recorded_total
            })
    
    # 输出结果
    print(f"📊 检查了 {len(matches)} 条评分记录")
    
    if errors:
        print(f"❌ 发现 {len(errors)} 条计算错误\n")
        
        for e in errors[:10]:  # 只显示前10个错误
            print(f"  #{e['num']} {e['name']}")
            print(f"    维度: {e['scores']}")
            print(f"    记录总分: {e['recorded']}/80")
            print(f"    实际总分: {e['actual']}/80")
            print(f"    差异: {e['diff']:+.1f}")
            print()
        
        if len(errors) > 10:
            print(f"  ... 还有 {len(errors) - 10} 条错误未显示\n")
        
        return False
    else:
        print("✅ 所有评分计算正确！")
        return True

if __name__ == '__main__':
    success = verify_scores()
    sys.exit(0 if success else 1)
