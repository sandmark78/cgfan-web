#!/usr/bin/env python3
"""
生成通过美学评价的提示词 markdown 文件
"""

import json
import os
import shutil
from pathlib import Path
from datetime import datetime

def load_data():
    """加载数据"""
    with open('parsed.json', 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    with open('scores.json', 'r', encoding='utf-8') as f:
        scores = json.load(f)
    
    return parsed, scores

def detect_model(title, prompt):
    """检测 AI 模型"""
    text = (title + ' ' + prompt).lower()
    
    if 'gpt' in text and ('image' in text or 'img' in text):
        return 'GPT-Image2'
    if 'midjourney' in text:
        return 'Midjourney'
    if 'gemini' in text or 'imagen' in text:
        return 'Gemini'
    if 'dall-e' in text or 'dalle' in text:
        return 'DALL-E'
    if 'stable diffusion' in text:
        return 'Stable Diffusion'
    
    return 'Common'

def detect_category(title, prompt):
    """检测分类"""
    text = (title + ' ' + prompt).lower()
    
    if any(kw in text for kw in ['portrait', '人物', '肖像', '人像']):
        return 'portrait'
    if any(kw in text for kw in ['landscape', '风景', '山水', '场景']):
        return 'landscape'
    if any(kw in text for kw in ['3d', 'render', '渲染', '建模']):
        return '3d'
    if any(kw in text for kw in ['style', '风格', '艺术', 'art']):
        return 'style'
    if any(kw in text for kw in ['product', '产品', '包装', '广告']):
        return 'product'
    if any(kw in text for kw in ['design', '设计', '海报', 'poster']):
        return 'design'
    
    return 'style'

def extract_tags(title, prompt, model):
    """提取标签"""
    text = (title + ' ' + prompt).lower()
    tags = []
    
    # 添加模型标签
    if model != 'Common':
        tags.append(model)
    
    # 添加内容标签
    if any(kw in text for kw in ['portrait', '人物', '肖像']):
        tags.append('人像')
    if any(kw in text for kw in ['landscape', '风景']):
        tags.append('风景')
    if any(kw in text for kw in ['3d', 'render']):
        tags.append('3D')
    if any(kw in text for kw in ['product', '产品', '广告']):
        tags.append('商业')
    if any(kw in text for kw in ['design', '设计', '海报']):
        tags.append('设计')
    if any(kw in text for kw in ['style', '风格', '艺术']):
        tags.append('艺术')
    if any(kw in text for kw in ['creative', '创意']):
        tags.append('创意')
    
    # 去重并限制数量
    tags = list(dict.fromkeys(tags))[:5]
    
    return tags

def detect_difficulty(prompt):
    """检测难度"""
    length = len(prompt)
    
    if length < 200:
        return 'beginner'
    elif length > 1200:
        return 'advanced'
    else:
        return 'intermediate'

def generate_markdown(item, score):
    """生成 markdown 文件"""
    title = item['title']
    prompt = item['chinese_prompt'] or item['english_prompt']
    
    model = detect_model(title, prompt)
    category = detect_category(title, prompt)
    tags = extract_tags(title, prompt, model)
    difficulty = detect_difficulty(prompt)
    
    # 生成 slug
    slug = f"gemnana-{item['id']}"
    
    # 生成日期
    date = item.get('date', datetime.now().strftime('%Y-%m-%d'))
    added = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+08:00')
    
    # 生成 tags yaml
    tags_yaml = '\n'.join([f'  - {tag}' for tag in tags])
    
    # 生成 markdown 内容
    content = f"""---
title: "{title}"
slug: {slug}
date: {date}
added: {added}
model: {model}
category: {category}
tags:
{tags_yaml}
difficulty: {difficulty}
source: "https://gemnana.com/zh/case/{item['id']}.html"
cover: /images/prompts/{slug}.jpg
---

## Prompt

{prompt}

## 美学评分

- 平均分: {score['avg']}
- 推荐: {'是' if score['recommend'] else '否'}
"""
    
    return slug, content

def main():
    parsed, scores = load_data()
    
    # 创建输出目录
    output_dir = Path('content/prompts/gemnana')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 创建图片目录
    img_dir = Path('public/images/prompts')
    img_dir.mkdir(parents=True, exist_ok=True)
    
    # 处理通过的图片
    passed_count = 0
    for item in parsed:
        item_id = item['id']
        
        if item_id not in scores:
            continue
        
        score = scores[item_id]
        
        if not score['recommend']:
            continue
        
        # 生成 markdown
        slug, content = generate_markdown(item, score)
        
        # 写入 markdown 文件
        md_path = output_dir / f"{slug}.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 复制图片
        # 查找本地图片文件
        img_files = list(Path('images').glob(f"{item_id}*"))
        if img_files:
            src_img = img_files[0]
            dst_img = img_dir / f"{slug}.jpg"
            shutil.copy2(src_img, dst_img)
            print(f"✓ {slug}: 图片已复制")
        else:
            print(f"✗ {slug}: 图片未找到")
        
        passed_count += 1
    
    print(f"\n生成完成: {passed_count} 个提示词")

if __name__ == '__main__':
    main()
