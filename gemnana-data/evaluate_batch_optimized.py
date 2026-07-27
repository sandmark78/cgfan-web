#!/usr/bin/env python3
"""
优化版美学评价脚本
- 分批处理，避免文件描述符耗尽
- 支持断点续传
- 自动保存进度
"""

import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

def load_progress():
    """加载进度"""
    progress_file = Path('evaluation_progress.json')
    if progress_file.exists():
        with open(progress_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'evaluated_ids': [], 'scores': {}, 'last_batch': 0}

def save_progress(progress):
    """保存进度"""
    with open('evaluation_progress.json', 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def get_next_batch(candidates, evaluated_ids, batch_size=5):
    """获取下一批待评价的图片"""
    remaining = [c for c in candidates if c['id'] not in evaluated_ids]
    return remaining[:batch_size]

def main():
    print("=" * 60)
    print("优化版美学评价脚本")
    print("=" * 60)
    
    # 加载数据
    with open('candidates.json', 'r', encoding='utf-8') as f:
        candidates = json.load(f)
    
    # 加载进度
    progress = load_progress()
    evaluated_ids = set(progress['evaluated_ids'])
    scores = progress['scores']
    
    print(f"总候选数: {len(candidates)}")
    print(f"已评价数: {len(evaluated_ids)}")
    print(f"待评价数: {len(candidates) - len(evaluated_ids)}")
    print()
    
    # 分批处理
    batch_size = 5
    batch_count = 0
    
    while True:
        # 获取下一批
        batch = get_next_batch(candidates, evaluated_ids, batch_size)
        
        if not batch:
            print("\n✓ 所有图片已评价完成！")
            break
        
        batch_count += 1
        print(f"\n{'='*60}")
        print(f"批次 {batch_count}: 处理 {len(batch)} 张图片")
        print(f"{'='*60}")
        
        # 输出批次信息
        for i, item in enumerate(batch, 1):
            img_path = Path(f"images/{item['id']}.jpg")
            status = "✓" if img_path.exists() else "✗"
            print(f"{i}. {status} {item['id']}: {item['title']}")
        
        # 保存当前批次信息供手动评价
        batch_file = Path(f"batch_{batch_count:03d}.json")
        with open(batch_file, 'w', encoding='utf-8') as f:
            json.dump(batch, f, ensure_ascii=False, indent=2)
        
        print(f"\n批次信息已保存到: {batch_file}")
        print("请使用 vision_analyze 评价这些图片，然后运行 update_scores.py 更新分数")
        
        # 等待用户输入
        input("\n按 Enter 继续下一批，或输入 'q' 退出: ")
        
        # 更新进度（假设用户已手动评价）
        # 这里可以添加自动读取评分的逻辑
        progress['last_batch'] = batch_count
        save_progress(progress)
        
        # 短暂延迟，避免过快
        time.sleep(1)

if __name__ == '__main__':
    main()
