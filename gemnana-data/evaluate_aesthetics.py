#!/usr/bin/env python3
"""
美学评价脚本 - 分批处理候选图片
每次处理50张，记录评分结果
"""

import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

def load_candidates():
    """加载候选数据"""
    with open('candidates.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def load_scores():
    """加载已有评分"""
    scores_file = Path('scores.json')
    if scores_file.exists():
        with open(scores_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_scores(scores):
    """保存评分"""
    with open('scores.json', 'w', encoding='utf-8') as f:
        json.dump(scores, f, ensure_ascii=False, indent=2)

def get_unscored_items(candidates, scores):
    """获取未评分的项目"""
    unscored = []
    for item in candidates:
        if item['id'] not in scores:
            unscored.append(item)
    return unscored

def evaluate_batch(items, batch_size=50):
    """
    评价一批图片
    注意：这里只是模拟，实际调用 vision_analyze 需要在 Hermes 环境中
    """
    results = []
    
    for i, item in enumerate(items[:batch_size]):
        print(f"[{i+1}/{min(batch_size, len(items))}] 评价 #{item['id']}: {item['title'][:30]}...")
        
        # 这里需要调用 vision_analyze
        # 但由于这是独立脚本，我们只生成任务清单
        results.append({
            'id': item['id'],
            'status': 'pending',
            'images': item['images'][:1]  # 只评价第一张图
        })
    
    return results

def generate_evaluation_tasks():
    """生成评价任务清单"""
    candidates = load_candidates()
    scores = load_scores()
    unscored = get_unscored_items(candidates, scores)
    
    print(f"候选数据: {len(candidates)} 条")
    print(f"已评分: {len(scores)} 条")
    print(f"待评分: {len(unscored)} 条")
    
    if not unscored:
        print("\n所有项目已评分！")
        return
    
    # 生成任务清单
    tasks = []
    batch_size = 50
    
    for i in range(0, len(unscored), batch_size):
        batch = unscored[i:i+batch_size]
        batch_num = i // batch_size + 1
        
        task = {
            'batch': batch_num,
            'items': [{
                'id': item['id'],
                'title': item['title'],
                'image': item['images'][0] if item['images'] else None
            } for item in batch]
        }
        tasks.append(task)
    
    # 保存任务清单
    with open('evaluation_tasks.json', 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)
    
    print(f"\n生成 {len(tasks)} 个批次任务")
    print(f"任务清单已保存到 evaluation_tasks.json")
    
    return tasks

if __name__ == '__main__':
    generate_evaluation_tasks()
