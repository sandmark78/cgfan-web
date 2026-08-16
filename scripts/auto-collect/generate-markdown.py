#!/usr/bin/env python3
"""Generate markdown files for preprocessed tweets."""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Import taste bonus calculator
sys.path.insert(0, 'scripts')
from taste_bonus import calculate_taste_adjustment, apply_adjustment

def extract_clean_prompt(allText: str, tweet_id: str) -> str:
    """Extract clean prompt from allText, removing metadata."""
    lines = allText.split('\n')
    prompt_lines = []
    in_prompt = False
    
    for line in lines:
        # Skip metadata
        if any(skip in line for skip in [
            '===ARTICLE', 'Made with AI', 'Views', 'PM ·', 'AM ·',
            '@', 'http', '#AI', '1:', '2:', '3:', '4:', '5:',
            '🤯', '📸', '🎨', '✨', '🕯️', '🧿', '🌿', '🧊', '🍋', '🧳', '☀️'
        ]):
            continue
        
        # Detect prompt start
        if any(kw in line for kw in ['提示词：', 'Prompt:', 'prompt:', '【主题】', '【STYLE】', 'Create a', 'A tiny mouse', 'Theme:', 'CITY:']):
            in_prompt = True
        
        if in_prompt:
            prompt_lines.append(line)
    
    # If no prompt detected, return empty
    if not prompt_lines:
        return ""
    
    # Clean up
    prompt = '\n'.join(prompt_lines)
    
    # Remove common noise patterns
    noise_patterns = [
        'Larus Canus', '尘林 Spark', 'Michael Rabone', 'Beanie Blossom',
        'Saul Goodman', 'Loriel.AI', 'simeon-sanai', 'LudovicCreator',
        '小小东', '月无关', 'Zidan 子丹',
        '@MrLarus', '@chenlinspark', '@michaelrabone', '@BeanieBlossom',
        '@Goodmanprotocol', '@ou_zhen599', '@Naiknelofar788', '@LudovicCreator',
        '@xiaoxiaodong01', '@0xkyne', '@liluocheng13',
        'Jul 14', 'Aug 15', 'Aug 16', 'Aug 14', 'Aug 13',
        '11:18 PM', '7:00 AM', '4:00 AM', '10:00 AM', '12:58 AM',
        '1:24 AM', '5:53 PM', '5:13 PM', '8:50 PM', '7:13 AM',
        '13.2K', '8.1K', '2.4K', '2.1K', '1.4K', '1.8K', '2.5K', '5.7K',
        'Views', '471', '388', '954', '11', '7', '28', '215', '192',
        'Made with AI', 'Show more', 'Prompt below 👇', 'Prompt in the comments 👇',
    ]
    
    for noise in noise_patterns:
        prompt = prompt.replace(noise, '')
    
    # Remove excessive whitespace
    lines = [line.strip() for line in prompt.split('\n')]
    lines = [line for line in lines if line]
    prompt = '\n'.join(lines)
    
    return prompt.strip()

def score_item(title: str, prompt: str, tags: list) -> dict:
    """Score an item across 8 dimensions."""
    # Base scores (all start at 7)
    base_scores = {
        'composition': 7,
        'color': 7,
        'lighting': 7,
        'detail': 7,
        'creativity': 7,
        'technical': 7,
        'aesthetic': 7,
        'curation': 7
    }
    
    # Apply taste adjustments
    adjustment = calculate_taste_adjustment(prompt, tags)
    final_scores = apply_adjustment(base_scores, adjustment)
    
    # Manual adjustments based on content type
    prompt_lower = prompt.lower()
    
    # Editorial/design content gets +1 curation
    if any(kw in prompt_lower for kw in ['editorial', '海报', 'poster', '排版', 'typography']):
        final_scores['curation'] = min(10, final_scores['curation'] + 1)
    
    # Travel content gets +1 composition
    if any(kw in prompt_lower for kw in ['旅行', 'travel', '城市', 'city']):
        final_scores['composition'] = min(10, final_scores['composition'] + 1)
    
    # Vintage/retro gets +1 aesthetic
    if any(kw in prompt_lower for kw in ['复古', 'retro', 'vintage', '胶片']):
        final_scores['aesthetic'] = min(10, final_scores['aesthetic'] + 1)
    
    # Framework/system gets +1 creativity
    if any(kw in prompt_lower for kw in ['框架', 'framework', '系统', 'system', '视觉系统']):
        final_scores['creativity'] = min(10, final_scores['creativity'] + 1)
    
    return final_scores

def generate_markdown(item: dict, title: str, tags: list, scores: dict, clean_prompt: str) -> str:
    """Generate markdown content."""
    tid = item['tweet_id']
    author = item['author']
    author_link = item['authorLink']
    date = item['date']
    added = datetime.now().isoformat(timespec='milliseconds') + '+08:00'
    source = item['source']
    
    # Determine model
    prompt_lower = clean_prompt.lower()
    if 'gpt' in prompt_lower or 'image 2' in prompt_lower or 'image2' in prompt_lower:
        model = 'GPT-Image2'
    elif 'midjourney' in prompt_lower or '--ar' in prompt_lower or '--v' in prompt_lower:
        model = 'Midjourney'
    else:
        model = '通用 Prompt'
    
    # Calculate total score
    total = sum(scores.values())
    
    # Build images list
    n_imgs = len(item.get('image_urls', []))
    images = []
    for i in range(n_imgs):
        if i == 0:
            images.append(f"/images/prompts/prompt-{tid}.jpg")
        else:
            images.append(f"/images/prompts/prompt-{tid}-{i+1}.jpg")
    
    # Build frontmatter
    tags_str = ', '.join([f'"{t}"' for t in tags])
    images_str = '\n  - '.join([f'"{img}"' for img in images])
    
    frontmatter = f"""---
title: "{title}"
slug: "prompt-{tid}"
author: "{author}"
authorLink: "{author_link}"
date: "{date}"
added: "{added}"
model: "{model}"
tags: [{tags_str}]
category: "设计"
summary: "{title}"
source: "{source}"
cover: "/images/prompts/prompt-{tid}.jpg"
images:
  - {images_str}
score: {total}
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

{clean_prompt}
"""
    
    return frontmatter

def main():
    # Load preprocessed data
    with open('data/auto-collect/preprocessed.json', 'r') as f:
        data = json.load(f)
    
    # Items to process
    items_config = [
        {
            'id': '2088872896437358881',
            'title': '视觉聚核：海报构图的四种力量',
            'tags': ['海报设计', '构图框架', '编辑排版', '视觉系统']
        },
        {
            'id': '2088993388460986600',
            'title': '地中海涂鸦与时尚人像的融合',
            'tags': ['时尚海报', '涂鸦艺术', '混合媒体', '编辑设计']
        },
        {
            'id': '2078072262368829730',
            'title': '胶片颗粒下的纽约皮草街拍',
            'tags': ['胶片摄影', '街拍', '黑白', '电影感']
        },
        {
            'id': '2087131922841379280',
            'title': '霓虹立体：Zendaya的五重风格',
            'tags': ['霓虹', '立体摄影', '双重曝光', '时尚']
        },
        {
            'id': '2088898063050117360',
            'title': '洗衣机里的小老鼠：剪纸插画',
            'tags': ['剪纸插画', '微缩', '故事书', '童趣']
        },
        {
            'id': '2089034457852338434',
            'title': '克苏鲁：Midjourney 6.1风格探索',
            'tags': ['克苏鲁', 'Midjourney', '暗黑', '风格探索']
        },
        {
            'id': '2089004186755092648',
            'title': 'IDENTITY TRACE：网版肖像与色彩扫描窗',
            'tags': ['实验海报', '网版印刷', '角色海报', '编辑设计']
        },
        {
            'id': '2088988526427898366',
            'title': '夏日涂鸦：真人与手绘的六格叙事',
            'tags': ['夏日海报', '涂鸦艺术', '六格漫画', '编辑设计']
        },
        {
            'id': '2088669387163369531',
            'title': '水彩城市：湿画法的旅行海报',
            'tags': ['水彩', '城市海报', '旅行', '编辑排版']
        },
        {
            'id': '2088976148801716425',
            'title': '城市地标汇聚：仰视角度的海报系统',
            'tags': ['城市海报', '地标', '构图框架', '视觉系统']
        },
        {
            'id': '2088901593836265855',
            'title': '拼贴旅行：撕纸边缘的视觉叙事',
            'tags': ['拼贴', '旅行海报', '纸艺', '编辑设计']
        },
        {
            'id': '2088992503433499013',
            'title': '博物馆展览：文物海报的仪式感',
            'tags': ['博物馆', '展览设计', '仪式感', '编辑排版']
        },
        {
            'id': '2088989167703208234',
            'title': '半调黑色解构：网点的灰度艺术',
            'tags': ['半调', '黑白', '解构', '实验设计']
        },
        {
            'id': '2088428890599694477',
            'title': '复古未来：黑底错版的印刷美学',
            'tags': ['复古', '未来主义', '印刷质感', '编辑设计']
        },
        {
            'id': '2088951153543270681',
            'title': '杂志封面：气泡字体与青春编辑',
            'tags': ['杂志封面', '气泡字体', '青春', '编辑设计']
        },
        {
            'id': '2088997439873425664',
            'title': '旅行女孩：手绘角色的四格实景',
            'tags': ['旅行海报', '手绘角色', '四格', '编辑设计']
        },
        {
            'id': '2088835863270813860',
            'title': '木刻旅行：手工质感的城市海报',
            'tags': ['木刻', '旅行海报', '手工质感', '复古印刷']
        },
        {
            'id': '2088639773900759489',
            'title': '复古旅行：丝网印刷的城市记忆',
            'tags': ['复古旅行', '丝网印刷', '城市', '手工质感']
        },
        {
            'id': '2088898567976947961',
            'title': '霓虹紫外线：五重立体风格',
            'tags': ['霓虹', '紫外线', '立体', '时尚']
        },
        {
            'id': '2088918226902409478',
            'title': '复古旅行：木刻与丝网的混合',
            'tags': ['复古旅行', '木刻', '丝网', '手工质感']
        },
    ]
    
    # Create output directory
    out_dir = Path('content/prompts')
    out_dir.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    for config in items_config:
        tid = config['id']
        item = next((i for i in data if i['tweet_id'] == tid), None)
        if not item:
            print(f"⚠️  {tid}: not found in data")
            continue
        
        # Extract clean prompt
        clean_prompt = extract_clean_prompt(item['allText'], tid)
        if not clean_prompt or len(clean_prompt) < 100:
            print(f"⚠️  {tid}: prompt too short or empty")
            continue
        
        # Score
        scores = score_item(config['title'], clean_prompt, config['tags'])
        total = sum(scores.values())
        
        # Skip if below threshold
        if total < 60:
            print(f"⚠️  {tid}: score {total} < 60, skipping")
            continue
        
        # Generate markdown
        md_content = generate_markdown(item, config['title'], config['tags'], scores, clean_prompt)
        
        # Write file
        filename = f"prompt-{tid}.md"
        filepath = out_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"✅ {filename}: {config['title']} ({total}/80)")
        processed += 1
    
    print(f"\n✅ Generated {processed} markdown files")

if __name__ == '__main__':
    main()
