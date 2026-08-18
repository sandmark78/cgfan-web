#!/usr/bin/env python3
"""
LLM 处理脚本 v2：直接处理所有条目
- 提取 prompt
- 过滤不合格内容
- 下载图片
- 生成 markdown（含评分）
"""

import json
import re
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

PROJECT = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
DATA = PROJECT / "data" / "auto-collect"
IMAGES_DIR = PROJECT / "public" / "images" / "prompts"
PROMPTS_DIR = PROJECT / "content" / "prompts"

sys.path.insert(0, str(PROJECT / "scripts"))
from taste_bonus import calculate_taste_adjustment
sys.path.insert(0, str(PROJECT / "scripts" / "auto-collect"))

def clean_prompt(text):
    """清理 prompt"""
    text = re.sub(r'===ARTICLE \d+===\n?', '', text)
    text = re.sub(r'^[^@\n]*@[^\s]+\n?', '', text, flags=re.MULTILINE)
    text = re.sub(r'\d{1,2}:\d{2}\s*(?:AM|PM)?\s*·\s*\w+\s+\d+', '', text)
    text = re.sub(r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+', '', text)
    text = re.sub(r'\d+\.?\d*[KMB]?\s*Views', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Made with (?:AI|ChatGPT|Midjourney)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Show more', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def download_images(image_urls, tweet_id):
    """下载图片"""
    downloaded = []
    for i, url in enumerate(image_urls):
        url = url.replace('format=webp', 'format=jpg')
        if 'format=' not in url:
            url += '&format=jpg' if '?' in url else '?format=jpg'
        
        if i == 0:
            filename = f"prompt-{tweet_id}.jpg"
        else:
            filename = f"prompt-{tweet_id}-{i+1}.jpg"
        
        save_path = IMAGES_DIR / filename
        
        try:
            result = subprocess.run(
                ['curl', '-sL', '-o', str(save_path), url],
                timeout=15, capture_output=True
            )
            
            if result.returncode == 0 and save_path.exists() and save_path.stat().st_size > 0:
                file_result = subprocess.run(['file', str(save_path)], capture_output=True, text=True)
                if 'WebP' in file_result.stdout and 'JPEG' not in file_result.stdout:
                    subprocess.run(['sips', '-s', 'format', 'jpeg', str(save_path), '--out', str(save_path)], capture_output=True)
                downloaded.append(f"/images/prompts/{filename}")
        except Exception as e:
            print(f"    ❌ 下载失败: {e}")
    
    return downloaded

def create_markdown(tweet_id, author, author_link, date, source, model, title, tags, 
                   category, summary, prompt, scores, images):
    """创建 markdown 文件"""
    slug = f"prompt-{tweet_id}"
    now = datetime.now()
    added = now.strftime('%Y-%m-%dT%H:%M:%S.') + f"{now.microsecond // 1000:03d}+08:00"
    
    images_yaml = ""
    if images:
        images_yaml = "images:\n" + "\n".join([f'  - "{img}"' for img in images])
    else:
        images_yaml = 'images: []'
    
    # 确保 scores 有 total
    if 'total' not in scores:
        scores['total'] = sum(v for k, v in scores.items() if k != 'total')
    
    frontmatter = f"""---
title: "{title}"
slug: "{slug}"
author: "{author}"
authorLink: "{author_link}"
date: {date}
added: "{added}"
model: "{model}"
tags: {json.dumps(tags, ensure_ascii=False)}
category: "{category}"
summary: "{summary}"
source: "{source}"
cover: "{images[0] if images else ''}"
{images_yaml}
score: {scores['total']}
composition: {scores['composition']}
color: {scores['color']}
lighting: {scores['lighting']}
detail: {scores['detail']}
creativity: {scores['creativity']}
technical: {scores['technical']}
aesthetic: {scores['aesthetic']}
curation: {scores['curation']}
---

## Prompt

{prompt}
"""
    
    filepath = PROMPTS_DIR / f"{slug}.md"
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(frontmatter)
    
    return filepath

# ===== 定义要收录的条目 =====
# 格式: (index, title, tags, category, model, scores, skip_reason)
# scores: (comp, color, lighting, detail, creativity, technical, aesthetic, curation)

COLLECTIONS = [
    # [1] Saul Goodman - 复古旅行海报模板
    {
        'idx': 1,
        'title': '复古旅行海报：城市街景的纸质记忆',
        'tags': ['旅行海报', '复古印刷', 'GPT-Image2', '编辑设计'],
        'category': '旅行海报',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 8, 'creativity': 7, 'technical': 8, 'aesthetic': 8, 'curation': 8},
    },
    # [3] 小小东 - 工业风遗迹墨痕海报
    {
        'idx': 3,
        'title': '工业遗迹墨痕：印刷噪点中的复古未来',
        'tags': ['编辑设计', '印刷质感', 'GPT-Image2', '复古未来'],
        'category': '编辑设计',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 9, 'creativity': 8, 'technical': 8, 'aesthetic': 8, 'curation': 9},
    },
    # [10] LudovicCreator - 粗野主义混凝土几何
    {
        'idx': 10,
        'title': '粗野主义几何：混凝土与冷调光影的建筑叙事',
        'tags': ['粗野主义', '建筑', 'Midjourney', '极简'],
        'category': '建筑',
        'model': 'Midjourney',
        'scores': {'composition': 9, 'color': 7, 'lighting': 8, 'detail': 8, 'creativity': 7, 'technical': 8, 'aesthetic': 8, 'curation': 8},
    },
    # [13] Larus Canus - 视觉聚核海报构图框架
    {
        'idx': 13,
        'title': '视觉聚核：四种向心构图的海报设计框架',
        'tags': ['编辑设计', '海报', 'GPT-Image2', '排版'],
        'category': '编辑设计',
        'model': 'GPT-Image2',
        'scores': {'composition': 9, 'color': 8, 'lighting': 7, 'detail': 8, 'creativity': 9, 'technical': 8, 'aesthetic': 8, 'curation': 9},
    },
    # [14] 小小东 - 天上宫阙赛博中国风
    {
        'idx': 14,
        'title': '赛博天城：云海宫阙的东方未来神话',
        'tags': ['东方美学', '仙侠', 'GPT-Image2', '赛博中国风'],
        'category': '东方美学',
        'model': 'GPT-Image2',
        'scores': {'composition': 9, 'color': 8, 'lighting': 9, 'detail': 8, 'creativity': 9, 'technical': 8, 'aesthetic': 9, 'curation': 8},
    },
    # [16] Soran - 月下误入天城
    {
        'idx': 16,
        'title': '月下天城：白衣背影走向云海深处的仙宫',
        'tags': ['东方美学', '仙侠', 'GPT-Image2', '电影感'],
        'category': '东方美学',
        'model': 'GPT-Image2',
        'scores': {'composition': 9, 'color': 8, 'lighting': 9, 'detail': 8, 'creativity': 8, 'technical': 8, 'aesthetic': 9, 'curation': 8},
    },
    # [17] Larus Canus - 巨型字体时尚编辑海报
    {
        'idx': 17,
        'title': '巨型字体：排版即主角的时尚编辑海报',
        'tags': ['编辑设计', '字体排版', 'GPT-Image2', '时尚'],
        'category': '编辑设计',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 8, 'creativity': 8, 'technical': 8, 'aesthetic': 8, 'curation': 9},
    },
    # [18] Saul Goodman - 水彩墨水旅行海报
    {
        'idx': 18,
        'title': '水彩漫游：墨水笔触下的城市地标速写',
        'tags': ['旅行海报', '水彩', 'GPT-Image2', '手绘'],
        'category': '旅行海报',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 7, 'creativity': 8, 'technical': 7, 'aesthetic': 8, 'curation': 8},
    },
    # [19] 小小东 - 二十四节气拍立得
    {
        'idx': 19,
        'title': '二十四节气：拍立得框中的东方时间美学',
        'tags': ['东方美学', '编辑设计', 'GPT-Image2', '拍立得'],
        'category': '东方美学',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 8, 'creativity': 8, 'technical': 8, 'aesthetic': 8, 'curation': 8},
    },
    # [21] simeon-sanai - 霓虹丝带城市旅行海报
    {
        'idx': 21,
        'title': '霓虹丝带：深底城市的手绘光轨旅行海报',
        'tags': ['旅行海报', '霓虹', 'GPT-Image2', '城市'],
        'category': '旅行海报',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 8, 'detail': 8, 'creativity': 8, 'technical': 8, 'aesthetic': 8, 'curation': 8},
    },
    # [22] Soran - 误入天宫氛围感模板
    {
        'idx': 22,
        'title': '天宫模板：框中框构图下的东方神域入口',
        'tags': ['东方美学', '仙侠', 'GPT-Image2', '建筑'],
        'category': '东方美学',
        'model': 'GPT-Image2',
        'scores': {'composition': 9, 'color': 8, 'lighting': 8, 'detail': 8, 'creativity': 8, 'technical': 8, 'aesthetic': 9, 'curation': 8},
    },
    # [23] simeon-sanai - 电影感城市旅行海报
    {
        'idx': 23,
        'title': '电影感城市：编辑视角的目的地旅行海报',
        'tags': ['旅行海报', '电影感', 'GPT-Image2', '编辑设计'],
        'category': '旅行海报',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 8, 'detail': 7, 'creativity': 7, 'technical': 8, 'aesthetic': 8, 'curation': 8},
    },
    # [29] Saul Goodman - 复古城市旅行海报
    {
        'idx': 29,
        'title': '复古四城：水彩墨水的城市地标旅行明信片',
        'tags': ['旅行海报', '复古', 'GPT-Image2', '水彩'],
        'category': '旅行海报',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 7, 'creativity': 8, 'technical': 7, 'aesthetic': 8, 'curation': 8},
    },
    # [36] 小小东 - 复古科幻海报封面
    {
        'idx': 36,
        'title': '轨道城市：巨型字块与磁悬浮列车的出版封面',
        'tags': ['编辑设计', '字体排版', 'GPT-Image2', '复古科幻'],
        'category': '编辑设计',
        'model': 'GPT-Image2',
        'scores': {'composition': 9, 'color': 8, 'lighting': 7, 'detail': 9, 'creativity': 9, 'technical': 8, 'aesthetic': 8, 'curation': 9},
    },
    # [37] Zidan 子丹 - 机械钴蓝系列
    {
        'idx': 37,
        'title': '钴蓝机械：深蓝色零件中的赛博生命体',
        'tags': ['科幻', '赛博朋克', 'Midjourney', '机械'],
        'category': '科幻',
        'model': 'Midjourney',
        'scores': {'composition': 8, 'color': 8, 'lighting': 8, 'detail': 9, 'creativity': 8, 'technical': 8, 'aesthetic': 8, 'curation': 7},
    },
    # [38] Saul Goodman - Risograph拼贴旅行海报
    {
        'idx': 38,
        'title': '孔版拼贴：三色印刷的旅行海报手工质感',
        'tags': ['旅行海报', 'Risograph', 'GPT-Image2', '拼贴'],
        'category': '旅行海报',
        'model': 'GPT-Image2',
        'scores': {'composition': 8, 'color': 8, 'lighting': 7, 'detail': 8, 'creativity': 8, 'technical': 8, 'aesthetic': 8, 'curation': 8},
    },
]

def main():
    print("🤖 开始 LLM 处理 v2...\n")
    
    with open(DATA / "preprocessed.json", 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📦 读取到 {len(data)} 条预处理数据")
    print(f"📋 计划收录 {len(COLLECTIONS)} 条\n")
    
    collected = 0
    skipped = 0
    
    for coll in COLLECTIONS:
        idx = coll['idx']
        item = data[idx]
        tweet_id = item['tweet_id']
        author = item['author']
        author_link = item.get('authorLink', '')
        date = item.get('date', '')
        source = item.get('source', '')
        allText = item['allText']
        imgs = item.get('imgs', [])
        image_urls = item.get('image_urls', [])
        
        print(f"[{idx}] {author} ({tweet_id})")
        
        # 提取 prompt
        prompt = ""
        # 优先从 ALT 提取
        for img in imgs:
            alt = img.get('alt', '')
            if len(alt) > 100:
                prompt = clean_prompt(alt)
                break
        
        # 其次从 allText 提取
        if not prompt:
            # 查找 "Prompt:" 后面的内容
            match = re.search(r'(?:Prompt|提示词)[：:]\s*\n?(.+?)(?=\n\n(?:Made with|Views|\d+:\d+ AM|===ARTICLE)|$)', allText, re.DOTALL | re.IGNORECASE)
            if match:
                prompt = clean_prompt(match.group(1))
        
        if not prompt or len(prompt) < 50:
            print(f"  ❌ 无法提取有效 prompt，跳过")
            skipped += 1
            continue
        
        # 截断过长的 prompt（保留核心内容）
        if len(prompt) > 2000:
            prompt = prompt[:2000] + "\n\n..."
        
        # 计算评分
        scores = coll['scores']
        total = sum(scores.values())
        scores['total'] = total  # 添加 total 字段
        print(f"  📊 评分：{'+'.join(str(v) for k, v in coll['scores'].items())}={total}/80")
        
        if total < 60:
            print(f"  ⚠️ 分数 < 60，不收录")
            skipped += 1
            continue
        
        # 生成 summary
        summary = prompt[:150].replace('\n', ' ') + '...' if len(prompt) > 150 else prompt.replace('\n', ' ')
        
        # 下载图片
        print(f"  📥 下载 {len(image_urls)} 张图片...")
        images = download_images(image_urls, tweet_id)
        print(f"     ✅ 下载 {len(images)} 张")
        
        # 创建 markdown
        filepath = create_markdown(
            tweet_id, author, author_link, date, source,
            coll['model'], coll['title'], coll['tags'],
            coll['category'], summary, prompt, scores, images
        )
        print(f"  ✅ 已创建：{filepath.name}")
        collected += 1
        print()
    
    print("\n" + "="*60)
    print(f"📊 处理完成：收录 {collected} 条，跳过 {skipped} 条")
    print("="*60)

if __name__ == '__main__':
    main()
