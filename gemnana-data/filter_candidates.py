#!/usr/bin/env python3
"""
初筛过滤：只保留有提示词且有图片的案例
"""

import json
from pathlib import Path

def filter_candidates():
    # 加载解析数据
    with open('parsed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"原始数据: {len(data)} 条")
    
    # 过滤条件
    candidates = []
    for item in data:
        # 必须有图片
        if not item.get('images'):
            continue
        
        # 必须有提示词（中文或英文）
        has_prompt = item.get('chinese_prompt') or item.get('english_prompt')
        if not has_prompt:
            continue
        
        # 提示词长度至少 50 字符
        prompt_len = len(item.get('chinese_prompt', '') or item.get('english_prompt', ''))
        if prompt_len < 50:
            continue
        
        candidates.append(item)
    
    print(f"初筛通过: {len(candidates)} 条")
    
    # 保存候选数据
    with open('candidates.json', 'w', encoding='utf-8') as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)
    
    # 统计
    with_cn = sum(1 for c in candidates if c.get('chinese_prompt'))
    with_en = sum(1 for c in candidates if c.get('english_prompt'))
    
    print(f"\n统计:")
    print(f"  有中文提示词: {with_cn}")
    print(f"  有英文提示词: {with_en}")
    print(f"  有来源: {sum(1 for c in candidates if c.get('source'))}")
    
    # 显示图片数量分布
    img_counts = {}
    for c in candidates:
        n = len(c.get('images', []))
        img_counts[n] = img_counts.get(n, 0) + 1
    
    print(f"\n图片数量分布:")
    for n in sorted(img_counts.keys()):
        print(f"  {n} 张图: {img_counts[n]} 条")
    
    return candidates

if __name__ == '__main__':
    filter_candidates()
