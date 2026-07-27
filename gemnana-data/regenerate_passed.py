#!/usr/bin/env python3
"""
重新生成已通过的提示词 markdown 文件（使用正确的模型信息）
"""

import json
import shutil
from pathlib import Path

def main():
    # 加载数据
    parsed_file = Path('parsed.json')
    scores_file = Path('scores.json')
    
    with open(parsed_file, 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    with open(scores_file, 'r', encoding='utf-8') as f:
        scores = json.load(f)
    
    # 找出通过的 ID
    passed_ids = [img_id for img_id, data in scores.items() if data.get('recommend')]
    
    print(f"找到 {len(passed_ids)} 条通过的提示词")
    
    # 创建输出目录
    output_dir = Path('content/prompts/gemnana')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 创建图片目录
    img_dir = Path('public/images/prompts')
    img_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成 markdown 文件
    for item in parsed:
        item_id = item['id']
        
        if item_id not in passed_ids:
            continue
        
        score = scores[item_id]
        slug = f"gemnana-{item_id}"
        
        # 提取提示词（优先英文）
        prompt = item.get('english_prompt', '') or item.get('chinese_prompt', '')
        if not prompt:
            print(f"跳过 {item_id}: 无提示词")
            continue
        
        # 生成 markdown 内容
        content = f"""---
title: "{item['title']}"
slug: {slug}
date: {item.get('date', '2026-07-26')}
added: {item.get('added', '2026-07-26T21:00:00+08:00')}
model: {item.get('model', 'Common')}
category: {item.get('category', 'style')}
tags:
{chr(10).join(['  - ' + tag for tag in item.get('tags', [])])}
difficulty: {item.get('difficulty', 'intermediate')}
source: "https://gemnana.com/zh/case/{item_id}.html"
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
        img_src = Path(f"images/{item_id}.jpg")
        img_dst = img_dir / f"{slug}.jpg"
        if img_src.exists() and not img_dst.exists():
            shutil.copy2(img_src, img_dst)
        
        print(f"✓ 生成: {slug} (模型: {item.get('model', 'Common')}, 评分: {score['avg']})")
    
    print(f"\n完成！共生成 {len(passed_ids)} 条提示词")

if __name__ == '__main__':
    main()
