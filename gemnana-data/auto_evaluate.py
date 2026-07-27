#!/usr/bin/env python3
"""
自动化评价流程
- 每次处理 5 张图片
- 自动保存进度
- 避免文件描述符耗尽
"""

import json
import os
import shutil
from pathlib import Path

def load_progress():
    """加载进度"""
    progress_file = Path('auto_progress.json')
    if progress_file.exists():
        with open(progress_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'evaluated_ids': [], 'scores': {}}

def save_progress(progress):
    """保存进度"""
    with open('auto_progress.json', 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def get_next_batch(candidates, evaluated_ids, batch_size=5):
    """获取下一批待评价的图片"""
    remaining = [c for c in candidates if c['id'] not in evaluated_ids]
    return remaining[:batch_size]

def generate_markdown(item, score):
    """生成 markdown 文件"""
    slug = f"gemnana-{item['id']}"
    
    prompt = item.get('english_prompt', '') or item.get('chinese_prompt', '')
    if not prompt:
        return False
    
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
    md_path = Path(f"content/prompts/gemnana/{slug}.md")
    md_path.parent.mkdir(parents=True, exist_ok=True)
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # 复制图片
    img_src = Path(f"images/{item['id']}.jpg")
    img_dst = Path(f"public/images/prompts/{slug}.jpg")
    img_dst.parent.mkdir(parents=True, exist_ok=True)
    if img_src.exists() and not img_dst.exists():
        shutil.copy2(img_src, img_dst)
    
    return True

def main():
    print("=" * 60)
    print("自动化评价流程")
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
    
    # 获取下一批
    batch = get_next_batch(candidates, evaluated_ids, 5)
    
    if not batch:
        print("✓ 所有图片已评价完成！")
        return
    
    print(f"当前批次: {len(batch)} 张图片")
    for i, item in enumerate(batch, 1):
        img_path = Path(f"images/{item['id']}.jpg")
        status = "✓" if img_path.exists() else "✗"
        print(f"{i}. {status} {item['id']}: {item['title']}")
    
    print("\n请手动评价这些图片，然后输入评分（格式: id1:score1,id2:score2,...）")
    print("示例: 52:8.5,53:7.2,55:8.0")
    
    scores_input = input("\n输入评分: ").strip()
    
    if not scores_input:
        print("未输入评分，跳过")
        return
    
    # 解析评分
    for item in scores_input.split(','):
        if ':' in item:
            img_id, score = item.split(':')
            img_id = img_id.strip()
            score = float(score.strip())
            
            scores[img_id] = {
                'avg': score,
                'recommend': score >= 8.0
            }
            
            if img_id not in evaluated_ids:
                evaluated_ids.add(img_id)
    
    # 保存进度
    progress['evaluated_ids'] = list(evaluated_ids)
    progress['scores'] = scores
    save_progress(progress)
    
    # 生成通过的提示词
    passed_count = 0
    for item in candidates:
        if item['id'] in scores and scores[item['id']]['recommend']:
            if generate_markdown(item, scores[item['id']]):
                passed_count += 1
    
    print(f"\n✓ 已更新 {len(scores_input.split(','))} 条评分")
    print(f"✓ 已生成 {passed_count} 条通过的提示词")
    print(f"\n总进度: {len(evaluated_ids)}/{len(candidates)} ({len(evaluated_ids)/len(candidates)*100:.1f}%)")

if __name__ == '__main__':
    main()
