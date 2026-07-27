#!/usr/bin/env python3
"""
批量评价脚本 - 非交互式
直接评价图片并保存结果
"""

import json
import shutil
from pathlib import Path

def load_progress():
    """加载进度"""
    # 优先读取 scores.json
    scores_file = Path('scores.json')
    if scores_file.exists():
        with open(scores_file, 'r', encoding='utf-8') as f:
            scores = json.load(f)
        return {'evaluated_ids': list(scores.keys()), 'scores': scores}
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
    print("批量评价脚本")
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
    print("请手动评价这些图片，然后运行 update_batch.py 更新分数")
    print()
    
    for i, item in enumerate(batch, 1):
        img_path = Path(f"images/{item['id']}.jpg")
        status = "✓" if img_path.exists() else "✗"
        print(f"{i}. {status} {item['id']}: {item['title']}")
    
    # 保存批次信息
    batch_file = Path('current_batch.json')
    with open(batch_file, 'w', encoding='utf-8') as f:
        json.dump(batch, f, ensure_ascii=False, indent=2)
    
    print(f"\n批次信息已保存到: {batch_file}")

if __name__ == '__main__':
    main()
