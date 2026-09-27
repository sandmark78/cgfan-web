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

# Import LLM cleaner
sys.path.insert(0, 'scripts/auto-collect')
from llm_cleaner import extract_prompt_with_llm, clean_prompt_for_display

def extract_clean_prompt(allText: str, tweet_id: str) -> str:
    """Extract clean prompt from allText using LLM."""
    try:
        clean_prompt, status = extract_prompt_with_llm(allText)
        
        if status == 'NO_PROMPT':
            print(f"  ℹ️  {tweet_id}: 无prompt")
            return ""
        elif status == 'INCOMPLETE':
            print(f"  ⚠️  {tweet_id}: prompt不完整")
            return ""
        elif status.startswith('ERROR'):
            print(f"  ❌ {tweet_id}: LLM错误 - {status}")
            return ""
        
        # 清理用于显示
        clean_prompt = clean_prompt_for_display(clean_prompt)
        return clean_prompt
    except Exception as e:
        print(f"  ❌ {tweet_id}: 提取失败 - {e}")
        return ""

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
    
    # Import batch title generator
    sys.path.insert(0, str(Path(__file__).parent))
    from importlib.machinery import SourceFileLoader
    llm_process = SourceFileLoader('llm_process', str(Path(__file__).parent / 'llm-process.py')).load_module()
    generate_titles_batch = llm_process.generate_titles_batch
    
    # Create output directory
    out_dir = Path('content/prompts')
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Phase 1: Extract prompts and score
    print("【阶段1】提取prompt并评分...")
    qualified_items = []
    
    for item in data:
        tid = item['tweet_id']
        
        # Extract clean prompt
        clean_prompt = extract_clean_prompt(item['allText'], tid)
        if not clean_prompt or len(clean_prompt) < 100:
            print(f"⚠️  {tid}: prompt too short or empty")
            continue
        
        # Extract tags (simple extraction)
        tags = []
        prompt_lower = clean_prompt.lower()
        if any(kw in prompt_lower for kw in ['海报', 'poster']):
            tags.append('海报设计')
        if any(kw in prompt_lower for kw in ['微缩', 'miniature']):
            tags.append('微缩景观')
        if any(kw in prompt_lower for kw in ['纸艺', 'paper']):
            tags.append('纸艺工艺')
        if any(kw in prompt_lower for kw in ['复古', 'retro', 'vintage']):
            tags.append('复古风格')
        if any(kw in prompt_lower for kw in ['电影', 'cinematic']):
            tags.append('电影感')
        if not tags:
            tags = ['AI创作']
        
        # Score
        scores = score_item('', clean_prompt, tags)
        total = sum(scores.values())
        
        # Skip if below threshold
        if total < 52:
            print(f"⚠️  {tid}: score {total} < 52, skipping")
            continue
        
        qualified_items.append({
            'item': item,
            'clean_prompt': clean_prompt,
            'tags': tags,
            'scores': scores,
            'total': total
        })
    
    if not qualified_items:
        print("⚠️ 没有符合条件的内容")
        return
    
    print(f"✅ {len(qualified_items)} 条内容通过评分")
    
    # Phase 2: Batch generate titles
    print("\n【阶段2】批量生成标题...")
    prompts_for_titles = [q['clean_prompt'] for q in qualified_items]
    titles = generate_titles_batch(prompts_for_titles)
    
    # Assign titles
    for i, q in enumerate(qualified_items):
        q['title'] = titles[i]
        print(f"  {i+1}. {q['item']['tweet_id']}: {titles[i]}")
    
    # Phase 3: Generate markdown
    print("\n【阶段3】生成markdown文件...")
    processed = 0
    for q in qualified_items:
        item = q['item']
        tid = item['tweet_id']
        title = q['title']
        tags = q['tags']
        scores = q['scores']
        clean_prompt = q['clean_prompt']
        total = q['total']
        
        # Generate markdown
        md_content = generate_markdown(item, title, tags, scores, clean_prompt)
        
        # Write file
        filename = f"prompt-{tid}.md"
        filepath = out_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
        
        print(f"✅ {filename}: {title} ({total}/80)")
        processed += 1
    
    print(f"\n✅ Generated {processed} markdown files")

if __name__ == '__main__':
    main()
