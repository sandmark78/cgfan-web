#!/usr/bin/env python3
"""
更新评分脚本
用于手动评价后更新分数和生成通过的提示词
"""

import json
import shutil
from pathlib import Path

def update_scores(batch_file, scores_input):
    """
    更新评分
    
    Args:
        batch_file: 批次文件路径 (如 batch_001.json)
        scores_input: 评分输入，格式为 "id1:score1,id2:score2,..."
                     例如: "52:8.5,53:7.2,55:8.0"
    """
    # 加载批次数据
    with open(batch_file, 'r', encoding='utf-8') as f:
        batch = json.load(f)
    
    # 解析评分输入
    scores_dict = {}
    for item in scores_input.split(','):
        if ':' in item:
            img_id, score = item.split(':')
            scores_dict[img_id.strip()] = float(score.strip())
    
    # 加载现有评分
    scores_file = Path('scores.json')
    if scores_file.exists():
        with open(scores_file, 'r', encoding='utf-8') as f:
            scores = json.load(f)
    else:
        scores = {}
    
    # 更新评分
    for img_id, score in scores_dict.items():
        scores[img_id] = {
            'avg': score,
            'recommend': score >= 8.0
        }
    
    # 保存评分
    with open(scores_file, 'w', encoding='utf-8') as f:
        json.dump(scores, f, ensure_ascii=False, indent=2)
    
    print(f"✓ 已更新 {len(scores_dict)} 条评分")
    
    # 生成通过的提示词
    passed_count = generate_passed_prompts(scores)
    
    return passed_count

def generate_passed_prompts(scores):
    """生成通过的提示词"""
    # 加载数据
    with open('parsed.json', 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    # 找出通过的 ID
    passed_ids = [img_id for img_id, data in scores.items() if data['recommend']]
    
    # 生成 markdown 文件
    output_dir = Path('content/prompts/gemnana')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    img_dir = Path('public/images/prompts')
    img_dir.mkdir(parents=True, exist_ok=True)
    
    count = 0
    for item in parsed:
        if item['id'] in passed_ids:
            score = scores[item['id']]
            slug = f"gemnana-{item['id']}"
            
            # 提取提示词（优先英文）
            prompt = item.get('english_prompt', '') or item.get('chinese_prompt', '')
            if not prompt:
                continue
            
            # 生成 markdown 内容
            content = f"""---
title: "{item['title']}"
slug: {slug}
date: {item.get('date', '2026-07-26')}
added: {item.get('added', '2026-07-26T22:00:00+08:00')}
model: {item.get('model', 'Common')}
category: {item.get('category', 'style')}
tags: {json.dumps(item.get('tags', []), ensure_ascii=False)}
difficulty: {item.get('difficulty', 'intermediate')}
source: "https://gemnana.com/zh/case/{item['id']}.html"
cover: /images/prompts/{slug}.jpg
---

## Prompt

{prompt}

## 美学评分

- 平均分: {score['avg']}
- 推荐: {'是' if score['recommend'] else '否'}
"""
            
            # 写入 markdown 文件
            md_path = output_dir / f"{slug}.md"
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 复制图片
            img_src = Path(f"images/{item['id']}.jpg")
            img_dst = img_dir / f"{slug}.jpg"
            if img_src.exists() and not img_dst.exists():
                shutil.copy2(img_src, img_dst)
            
            count += 1
    
    print(f"✓ 已生成 {count} 条通过的提示词")
    return count

def main():
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python3 update_scores.py <batch_file> <scores>")
        print("示例: python3 update_scores.py batch_001.json '52:8.5,53:7.2,55:8.0'")
        return
    
    batch_file = sys.argv[1]
    scores_input = sys.argv[2]
    
    passed_count = update_scores(batch_file, scores_input)
    print(f"\n完成！共生成 {passed_count} 条通过的提示词")

if __name__ == '__main__':
    main()
