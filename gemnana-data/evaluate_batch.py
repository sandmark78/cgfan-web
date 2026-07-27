#!/usr/bin/env python3
"""
美学评价自动化脚本
- 每次处理一批图片（默认20张）
- 调用 vision_analyze 进行评价
- 记录评分结果
- 筛选出平均分>=8的图片
"""

import json
import os
import sys
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

def get_next_batch(candidates, scores, batch_size=20):
    """获取下一批待评价的图片"""
    unscored = []
    for item in candidates:
        if item['id'] not in scores:
            # 只取第一张图片进行评价
            if item.get('images'):
                unscored.append({
                    'id': item['id'],
                    'title': item['title'],
                    'image': item['images'][0],
                    'full_data': item
                })
    
    return unscored[:batch_size]

def generate_evaluation_prompt(item):
    """生成评价提示词"""
    return f"""请评价这张AI生成图片的审美价值，从以下维度打分（1-10分）：

1. 构图（Composition）：画面布局、视觉平衡、主体位置
2. 色彩（Color）：色彩搭配、和谐度、情感表达
3. 光影（Lighting）：光线运用、明暗对比、氛围营造
4. 细节（Details）：细节丰富度、质感表现、精细程度
5. 创意（Creativity）：独特性、创新性、想象力

请给出：
- 各维度分数
- 平均分
- 简短评价（50字以内）
- 是否推荐收录（是/否）

图片路径：{item['image']}
标题：{item['title']}
"""

def main():
    # 加载数据
    candidates = load_candidates()
    scores = load_scores()
    
    # 获取下一批
    batch = get_next_batch(candidates, scores, batch_size=20)
    
    if not batch:
        print("所有图片已评价完成！")
        return
    
    print(f"待评价: {len(batch)} 张图片")
    print(f"已完成: {len(scores)} / {len([c for c in candidates if c.get('images')])}")
    
    # 生成评价任务
    tasks = []
    for item in batch:
        task = {
            'id': item['id'],
            'title': item['title'],
            'image_path': item['image'],
            'prompt': generate_evaluation_prompt(item)
        }
        tasks.append(task)
    
    # 保存任务清单
    with open('current_batch.json', 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)
    
    print(f"\n已生成评价任务清单: current_batch.json")
    print(f"请运行: hermes agent '请评价 current_batch.json 中的图片，将结果保存到 scores.json'")

if __name__ == '__main__':
    main()
