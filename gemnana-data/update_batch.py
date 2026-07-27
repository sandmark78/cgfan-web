#!/usr/bin/env python3
"""
更新批次评分并生成通过的提示词
"""

import json
import shutil
from pathlib import Path

def main():
    # 加载批次数据
    with open('current_batch.json', 'r', encoding='utf-8') as f:
        batch = json.load(f)
    
    # 加载现有评分
    with open('scores.json', 'r', encoding='utf-8') as f:
        scores = json.load(f)
    
    # 加载解析数据
    with open('parsed.json', 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    # 创建映射
    parsed_map = {item['id']: item for item in parsed}
    
    print(f"批次大小: {len(batch)}")
    print(f"现有评分数: {len(scores)}")
    print()
    
    # 生成通过的提示词
    passed_count = 0
    for item in batch:
        img_id = item['id']
        
        if img_id not in scores:
            print(f"跳过 {img_id}: 未评价")
            continue
        
        score = scores[img_id]
        
        if not score.get('recommend', False):
            print(f"跳过 {img_id}: 未通过 (分数: {score.get('avg', 0)})")
            continue
        
        # 生成 markdown
        slug = f"gemnana-{img_id}"
        prompt = item.get('english_prompt', '') or item.get('chinese_prompt', '')
        
        if not prompt:
            print(f"跳过 {img_id}: 无提示词")
            continue
        
        content = f"""---
title: "{item['title']}"
slug: {slug}
date: {item.get('date', '2026-07-26')}
added: {item.get('added', '2026-07-26T22:00:00+08:00')}
model: {item.get('model', 'Common')}
category: {item.get('category', 'style')}
tags: {json.dumps(item.get('tags', []), ensure_ascii=False)}
difficulty: {item.get('difficulty', 'intermediate')}
source: "https://gemnana.com/zh/case/{img_id}.html"
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
        img_src = Path(f"images/{img_id}.jpg")
        img_dst = Path(f"public/images/prompts/{slug}.jpg")
        img_dst.parent.mkdir(parents=True, exist_ok=True)
        if img_src.exists() and not img_dst.exists():
            shutil.copy2(img_src, img_dst)
        
        passed_count += 1
        print(f"✓ 生成: {slug} (分数: {score['avg']})")
    
    print(f"\n完成！生成 {passed_count} 条通过的提示词")

if __name__ == '__main__':
    main()
