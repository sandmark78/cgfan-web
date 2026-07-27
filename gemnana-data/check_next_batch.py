#!/usr/bin/env python3
"""
批量评价脚本 - 独立进程版本
避免文件描述符泄漏
"""

import json
import os
import sys
from pathlib import Path

def main():
    # 加载数据
    scores_file = Path('scores.json')
    parsed_file = Path('parsed.json')
    
    with open(scores_file, 'r', encoding='utf-8') as f:
        scores = json.load(f)
    
    with open(parsed_file, 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    evaluated = set(scores.keys())
    
    # 找下一批有图片的待评价
    candidates = []
    for p in parsed:
        if p['id'] not in evaluated:
            img_path = Path(f"images/{p['id']}.jpg")
            if img_path.exists():
                candidates.append(p)
        if len(candidates) >= 5:
            break
    
    if not candidates:
        print("没有更多待评价的图片")
        return
    
    # 输出待评价列表
    for c in candidates:
        print(f"{c['id']}: {c['title']}")
    
    print(f"\n总计待评价(有图): {len([p for p in parsed if p['id'] not in evaluated and Path(f'images/{p['id']}.jpg').exists()])}")

if __name__ == '__main__':
    main()
