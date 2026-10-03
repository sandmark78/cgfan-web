#!/usr/bin/env python3
"""
LLM processing batch script for CGfan auto-collect.
Processes preprocessed.json: extracts prompts, scores, filters, downloads images, generates markdown.
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# Add scripts dir to path for taste_bonus
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from taste_bonus import calculate_taste_adjustment, apply_adjustment

BASE_DIR = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')
DATA_DIR = BASE_DIR / 'data' / 'auto-collect'
IMAGES_DIR = BASE_DIR / 'public' / 'images' / 'prompts'
CONTENT_DIR = BASE_DIR / 'content' / 'prompts' / '2026' / '10' / '04'

# Ensure directories exist
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
CONTENT_DIR.mkdir(parents=True, exist_ok=True)

# Filter keywords
FILTER_PORTRAIT = ['私房写真', 'private portrait', 'private photoshoot', 'boudoir', 'lingerie', 
                   'sheer', 'see-through', 'partially clothed', 'disheveled', 'y2k digital camera',
                   'panties', 'bra strap', 'camisole', 'spaghetti-strap', 'stockings', 'slip dress']
FILTER_COS = ['cos', 'cosplay', '角色扮演']
FILTER_VIDEO = ['视频', 'video', 'mp4', '60帧', '90帧', '超分']
FILTER_NO_PROMPT = ['no prompt', 'no text']

def extract_clean_prompt(all_text, tweet_id):
    """Extract clean prompt from allText, removing author info, timestamps, engagement data."""
    text = all_text
    
    # Remove author name and @handle lines at start
    lines = text.split('\n')
    clean_lines = []
    skip_author = True
    for line in lines:
        stripped = line.strip()
        # Skip author name line (first non-empty line that's not a prompt)
        if skip_author and stripped and not stripped.startswith('@') and not stripped.startswith('#') and not stripped.startswith('```'):
            # Check if it looks like an author name (short, no prompt keywords)
            if len(stripped) < 30 and not any(kw in stripped.lower() for kw in ['prompt', 'create', 'a ', 'the ', 'portrait', 'generate']):
                skip_author = False
                continue
        if stripped.startswith('@') and skip_author:
            continue
        if stripped in ['Show translation', 'Made with AI']:
            continue
        # Skip timestamp lines
        if re.match(r'\d+:\d+\s*(AM|PM)\s*·\s*\w+\s+\d+', stripped):
            continue
        # Skip Views/engagement lines
        if re.match(r'^[\d,.]+$', stripped):
            continue
        if stripped == 'Views':
            continue
        clean_lines.append(line)
    
    text = '\n'.join(clean_lines)
    
    # Remove "Show translation" 
    text = re.sub(r'Show translation\n?', '', text)
    text = re.sub(r'Made with AI\n?', '', text)
    
    # Remove trailing engagement stats (numbers at end)
    text = re.sub(r'\n\d[\d,]*\n\d[\d,]*\n\d[\d,]*\s*$', '', text)
    
    # Extract prompt from code blocks if present
    code_match = re.search(r'```\n?(.*?)```', text, re.DOTALL)
    if code_match:
        return code_match.group(1).strip()
    
    # Look for "Prompt:" or "提示词" sections
    prompt_match = re.search(r'(?:Prompt|提示词)[：:]\s*\n?(.*?)(?:\n\n|\n\d:\d+|$)', text, re.DOTALL | re.IGNORECASE)
    if prompt_match:
        prompt_text = prompt_match.group(1).strip()
        if len(prompt_text) > 50:
            return prompt_text
    
    # Look for "prompt in alt" references
    if 'prompt in alt' in text.lower():
        return None  # Will check image alt text
    
    # If the text itself is a prompt (English, descriptive, > 100 chars)
    if len(text) > 100 and re.search(r'[a-zA-Z]{3,}', text):
        # Check it's not just commentary
        if any(kw in text.lower() for kw in ['create', 'generate', 'portrait of', 'a ', 'the ', 'style', 'photography']):
            return text.strip()
    
    return None

def extract_prompt_from_alt(imgs):
    """Extract prompt from image alt text."""
    for img in imgs:
        alt = img.get('alt', '')
        if alt and len(alt) > 50:
            return alt.strip()
    return None

def identify_model(all_text, prompt_text):
    """Identify the AI model used."""
    combined = (all_text + ' ' + (prompt_text or '')).lower()
    
    if 'gpt image 2.5' in combined or 'gpt-image 2.5' in combined or 'gpt image2.5' in combined or 'images 2.5' in combined:
        return 'GPT-Image-2.5'
    if 'midjourney' in combined or '--v 8' in combined or '--ar ' in combined:
        return 'Midjourney'
    if 'gemini' in combined:
        return 'Gemini'
    if 'nano banana' in combined:
        return 'Nano Banana'
    if 'grok' in combined:
        return 'Grok'
    return '通用 Prompt'

def should_filter(all_text, prompt_text, imgs):
    """Check if this tweet should be filtered out. Returns (should_filter, reason)."""
    combined = (all_text + ' ' + (prompt_text or '')).lower()
    
    # No valid prompt
    if not prompt_text or len(prompt_text) < 30:
        return True, '无有效prompt'
    
    # Video content
    for kw in FILTER_VIDEO:
        if kw in combined:
            return True, f'视频内容({kw})'
    
    # Private portrait / suggestive
    for kw in FILTER_PORTRAIT:
        if kw in combined:
            # Check if it has strong artistic context (古风/仙侠/电影感)
            has_artistic = any(kw2 in combined for kw2 in ['古风', '仙侠', '电影感', 'cinematic', 'storybook'])
            if not has_artistic:
                return True, f'隐晦性暗示/私房({kw})'
    
    # COS写真 without artistic context
    if any(kw in combined for kw in ['cos', 'cosplay']):
        if not any(kw2 in combined for kw2 in ['古风', '仙侠', '电影感', 'street', '街拍']):
            return True, 'COS写真'
    
    # Pure portrait without artistic merit
    if 'portrait' in combined and len(prompt_text) < 200:
        if not any(kw in combined for kw in ['古风', '仙侠', '电影感', 'storybook', 'editorial', 'cinematic', 'fantasy']):
            return True, '纯人像写真'
    
    # QT/share threads without actual prompt
    if 'qt or share' in combined or 'share your' in combined:
        if not prompt_text or len(prompt_text) < 50:
            return True, '互动帖无prompt'
    
    # Challenge/thread posts without prompt
    if 'saturday challenge' in combined or 'temporal ghost' in combined:
        # These have template prompts, check if usable
        if '[SUBJECT]' in (prompt_text or '') and len(prompt_text or '') < 200:
            return True, '模板prompt无具体示例'
    
    return False, ''

def score_prompt(prompt_text, all_text, model, imgs):
    """Score the prompt on 8 dimensions. Returns (scores_dict, total)."""
    combined = (all_text + ' ' + (prompt_text or '')).lower()
    
    # Base scores (5-10 range)
    scores = {
        'composition': 7,
        'color': 7,
        'lighting': 7,
        'detail': 7,
        'creativity': 7,
        'technical': 7,
        'aesthetic': 7,
        'curation': 7
    }
    
    # Composition adjustments
    if any(kw in combined for kw in ['构图', 'composition', 'framing', 'rule of thirds', 'negative space', '留白']):
        scores['composition'] = 8
    if any(kw in combined for kw in ['cliff', '夹缝', 'split', 'contrast composition']):
        scores['composition'] = 9
    if any(kw in combined for kw in ['poster', '海报', 'editorial layout']):
        scores['composition'] = 8
    
    # Color adjustments
    if any(kw in combined for kw in ['配色', 'color palette', 'duotone', '高反差', 'neon']):
        scores['color'] = 8
    if any(kw in combined for kw in ['朱砂红', 'acid yellow', 'saturated', 'vibrant']):
        scores['color'] = 9
    
    # Lighting adjustments
    if any(kw in combined for kw in ['lighting', '光影', 'backlit', 'rim light', 'golden hour']):
        scores['lighting'] = 8
    if any(kw in combined for kw in ['cinematic lighting', 'volumetric', 'dramatic light']):
        scores['lighting'] = 9
    
    # Detail adjustments
    if any(kw in combined for kw in ['ultra-detailed', 'intricate', 'fine detail', 'texture']):
        scores['detail'] = 8
    if any(kw in combined for kw in ['8k', 'photorealistic', 'hyperrealistic']):
        scores['detail'] = 8
    
    # Creativity adjustments
    if any(kw in combined for kw in ['miniature', '微缩', 'storybook', 'whimsical', 'fantasy']):
        scores['creativity'] = 9
    if any(kw in combined for kw in ['surreal', '超现实', 'conceptual']):
        scores['creativity'] = 8
    if any(kw in combined for kw in ['typography as image', '字体即图形', 'text as visual']):
        scores['creativity'] = 9
    
    # Technical adjustments
    if any(kw in combined for kw in ['--v 8', '--raw', '--stylize', 'professional']):
        scores['technical'] = 8
    if any(kw in combined for kw in ['cannes-level', 'premium', 'gallery-grade']):
        scores['technical'] = 8
    
    # Aesthetic adjustments
    if any(kw in combined for kw in ['东方', 'oriental', '水墨', '古风']):
        scores['aesthetic'] = 9
    if any(kw in combined for kw in ['editorial', 'fashion', 'luxury']):
        scores['aesthetic'] = 8
    
    # Curation adjustments
    if any(kw in combined for kw in ['series', 'collection', 'set of', 'campaign']):
        scores['curation'] = 8
    if len(prompt_text or '') > 500:
        scores['curation'] = min(scores['curation'] + 1, 10)
    
    # Apply taste bonus
    tags = []
    if '微缩' in combined or 'miniature' in combined:
        tags.append('微缩')
    if '东方' in combined or 'oriental' in combined:
        tags.append('东方')
    if '复古' in combined or 'retro' in combined:
        tags.append('复古')
    if '胶片' in combined or 'film' in combined:
        tags.append('胶片')
    if '故事书' in combined or 'storybook' in combined:
        tags.append('故事书')
    if '旅行' in combined or 'travel' in combined:
        tags.append('旅行')
    if '编辑设计' in combined or 'editorial' in combined:
        tags.append('编辑设计')
    if '纸艺' in combined or 'paper cut' in combined:
        tags.append('纸艺')
    
    adjustment = calculate_taste_adjustment(prompt_text or '', tags)
    scores = apply_adjustment(scores, adjustment)
    
    # Enforce: at least 1 dimension <= 7
    max_count = sum(1 for v in scores.values() if v >= 8)
    if max_count == 8:
        # Reduce the lowest-scored dimension that's >= 8
        min_dim = min(scores, key=scores.get)
        if scores[min_dim] >= 8:
            scores[min_dim] = 7
        else:
            # Find any dim >= 8 and reduce it
            for dim in ['curation', 'technical', 'detail']:
                if scores[dim] >= 8:
                    scores[dim] = 7
                    break
    
    total = sum(scores.values())
    return scores, total

def generate_title(prompt_text, all_text, category):
    """Generate a Chinese title ≤20 chars with visual imagery."""
    combined = (all_text + ' ' + (prompt_text or '')).lower()
    
    # Strong preference keywords that allow high scores
    title_map = {
        '微缩': '微缩世界',
        'miniature': '微缩奇境',
        '纸艺': '纸艺幻境',
        'paper cut': '纸艺剪影',
        '东方': '东方意境',
        'oriental': '东方美学',
        '水墨': '水墨丹青',
        '仙侠': '仙侠世界',
        '古风': '古韵风华',
        '电影感': '电影光影',
        'cinematic': '电影质感',
        '复古': '复古未来',
        'retro': '复古美学',
        '旅行': '旅行手记',
        'travel': '旅行印象',
        '手绘': '手绘温度',
        'hand-drawn': '手绘质感',
        '工笔': '工笔细描',
        '线描': '线描之美',
        'storybook': '绘本奇境',
        '故事书': '故事绘本',
        'poster': '海报设计',
        '海报': '视觉海报',
        'editorial': '编辑美学',
        'typography': '字体构图',
        'neon': '霓虹光影',
        'fantasy': '奇幻世界',
        '奇幻': '奇幻之境',
    }
    
    for kw, title in title_map.items():
        if kw in combined:
            return title[:20]
    
    # Default titles by category
    cat_titles = {
        '国风': '东方意韵',
        '奇幻': '奇幻想象',
        '科幻': '未来视界',
        '微缩': '微缩天地',
        '编辑设计': '编辑之美',
        '海报': '海报艺术',
        '插画': '插画世界',
        '3D渲染': '三维幻境',
        '摄影': '光影记录',
        '建筑': '建筑美学',
        '产品': '产品视觉',
        '其他': 'AI视觉',
    }
    return cat_titles.get(category, 'AI视觉创作')[:20]

def determine_category(prompt_text, all_text):
    """Determine the category of the content."""
    combined = (all_text + ' ' + (prompt_text or '')).lower()
    
    if any(kw in combined for kw in ['东方', 'oriental', '水墨', '古风', '仙侠', '国风', 'chinese']):
        return '国风'
    if any(kw in combined for kw in ['miniature', '微缩', 'diorama', 'tiny']):
        return '微缩'
    if any(kw in combined for kw in ['fantasy', '奇幻', 'storybook', 'whimsical', 'fairy']):
        return '奇幻'
    if any(kw in combined for kw in ['sci-fi', '科幻', 'futuristic', 'cyberpunk', 'space']):
        return '科幻'
    if any(kw in combined for kw in ['poster', '海报', 'editorial', 'typography', '排版']):
        return '编辑设计'
    if any(kw in combined for kw in ['travel', '旅行', 'city', '城市', 'landscape']):
        return '摄影'
    if any(kw in combined for kw in ['3d', 'render', 'cgi', 'blender']):
        return '3D渲染'
    if any(kw in combined for kw in ['illustration', 'illustrator', 'gouache', 'watercolor', 'hand-drawn']):
        return '插画'
    if any(kw in combined for kw in ['product', 'commercial', 'beverage', 'food', 'automotive']):
        return '产品'
    if any(kw in combined for kw in ['architecture', 'building', 'interior']):
        return '建筑'
    if any(kw in combined for kw in ['portrait', 'photography', 'film', 'cinematic']):
        return '摄影'
    return '其他'

def extract_tags(prompt_text, all_text, category):
    """Extract 3-5 relevant tags."""
    combined = (all_text + ' ' + (prompt_text or '')).lower()
    tags = []
    
    tag_keywords = {
        '微缩': ['miniature', '微缩', 'tiny', 'diorama'],
        '纸艺': ['paper cut', '纸艺', 'paper art', 'origami'],
        '东方美学': ['东方', 'oriental', '水墨', '古风'],
        '电影感': ['cinematic', '电影感', 'film'],
        '复古': ['retro', '复古', 'vintage', 'analog'],
        '故事书': ['storybook', '故事书', '绘本', 'picture book'],
        '海报设计': ['poster', '海报', 'editorial'],
        '霓虹': ['neon', '霓虹', 'ultraviolet'],
        '奇幻': ['fantasy', '奇幻', 'whimsical'],
        '旅行': ['travel', '旅行', 'city'],
        '产品摄影': ['product', 'commercial', 'beverage'],
        '手绘': ['hand-drawn', '手绘', 'illustration', 'gouache'],
        '3D渲染': ['3d', 'cgi', 'render'],
        '超现实': ['surreal', '超现实'],
        '字体设计': ['typography', '字体', 'lettering'],
    }
    
    for tag, kws in tag_keywords.items():
        if any(kw in combined for kw in kws):
            tags.append(tag)
    
    # Add category as tag if not already present
    if category not in tags:
        tags.insert(0, category)
    
    # Add model tag
    model = identify_model(all_text, prompt_text)
    if model != '通用 Prompt':
        tags.append(model)
    
    return tags[:5]

def download_image(url, filepath):
    """Download an image from URL to filepath."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            with open(filepath, 'wb') as f:
                f.write(data)
        return True
    except Exception as e:
        print(f"  Download error: {e}")
        return False

def process_tweet(item, idx):
    """Process a single tweet. Returns processing result dict."""
    tweet_id = item['tweet_id']
    author = item['author']
    author_link = item.get('authorLink', '')
    all_text = item['allText']
    imgs = item.get('imgs', [])
    image_urls = item.get('image_urls', [])
    source = item.get('source', f'https://x.com/i/status/{tweet_id}')
    
    result = {
        'tweet_id': tweet_id,
        'author': author,
        'status': '',
        'score': 0,
        'reason': ''
    }
    
    # Step 1: Extract prompt
    prompt_text = extract_clean_prompt(all_text, tweet_id)
    if not prompt_text:
        prompt_text = extract_prompt_from_alt(imgs)
    if not prompt_text or len(prompt_text) < 30:
        result['status'] = 'filtered'
        result['reason'] = '无有效prompt'
        return result
    
    # Step 2: Check filters
    should_skip, filter_reason = should_filter(all_text, prompt_text, imgs)
    if should_skip:
        result['status'] = 'filtered'
        result['reason'] = filter_reason
        return result
    
    # Step 3: Identify model
    model = identify_model(all_text, prompt_text)
    
    # Step 4: Score
    scores, total = score_prompt(prompt_text, all_text, model, imgs)
    result['score'] = total
    
    if total < 55:
        result['status'] = 'low_score'
        result['reason'] = f'总分{total}<55'
        return result
    
    # Step 5: High score check - must have strong preference keyword in title
    category = determine_category(prompt_text, all_text)
    title = generate_title(prompt_text, all_text, category)
    
    if total >= 68:
        strong_keywords = ['微缩', '纸艺', '东方', '仙侠', '电影感', '复古', '旅行', '手绘', '工笔', '线描',
                          '水墨', '古风', '奇幻', '故事书', '绘本', '海报', '编辑', '霓虹', '超现实']
        has_strong = any(kw in title for kw in strong_keywords)
        if not has_strong:
            # Check if prompt itself has strong keywords
            combined = (all_text + ' ' + prompt_text).lower()
            has_strong = any(kw in combined for kw in ['miniature', '微缩', 'paper cut', '纸艺', '东方', 'oriental',
                                                        '水墨', 'storybook', '故事书', 'editorial', 'neon', '霓虹',
                                                        'cinematic', '电影感', 'retro', '复古', 'surreal', '超现实'])
            if not has_strong:
                result['status'] = 'low_score'
                result['reason'] = f'高分{total}但无强偏好关键词'
                return result
    
    # Step 6: Download images (max 4)
    slug = f'prompt-{tweet_id}'
    images_to_save = []
    urls_to_download = image_urls[:4] if image_urls else []
    
    for i, url in enumerate(urls_to_download):
        if i == 0:
            filename = f'{slug}.jpg'
        else:
            filename = f'{slug}-{i+1}.jpg'
        filepath = IMAGES_DIR / filename
        if download_image(url, str(filepath)):
            images_to_save.append(f'/images/prompts/{filename}')
    
    if not images_to_save:
        result['status'] = 'filtered'
        result['reason'] = '图片下载失败'
        return result
    
    # Step 7: Generate markdown
    tags = extract_tags(prompt_text, all_text, category)
    
    # Clean prompt for display - remove author handles and metadata
    clean_prompt = prompt_text
    # Remove lines that look like author attribution
    clean_prompt = re.sub(r'^[^@\n]*@[^\n]+\n?', '', clean_prompt)
    clean_prompt = clean_prompt.strip()
    
    # Determine author link
    real_author_link = author_link
    if 'in_reply_to' in author_link:
        # Try to extract actual author from all_text
        handle_match = re.search(r'@(\w+)', all_text)
        if handle_match:
            real_author_link = f'https://x.com/{handle_match.group(1)}'
    
    md_content = f"""---
title: "{title}"
slug: "{slug}"
author: "{author}"
authorLink: "{real_author_link}"
source: "{source}"
date: "2026-10-04"
added: "2026-10-04T06:00:00.000+08:00"
cover: "{images_to_save[0]}"
images:
"""
    for img_path in images_to_save:
        md_content += f'  - "{img_path}"\n'
    
    md_content += f"""category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "{model}"
score: {{{', '.join(f'{k}: {v}' for k, v in scores.items())}}}
---

## Prompt

{clean_prompt}
"""
    
    md_path = CONTENT_DIR / f'{slug}.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    result['status'] = 'collected'
    result['reason'] = f'总分{total}, 下载{len(images_to_save)}张图片'
    return result

def main():
    # Load data
    with open(DATA_DIR / 'preprocessed.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total = len(data)
    filtered = 0
    low_score = 0
    collected = 0
    details = []
    
    for i, item in enumerate(data):
        print(f"Processing [{i+1}/{total}]: {item['tweet_id']} - {item['author']}")
        result = process_tweet(item, i)
        details.append(result)
        
        if result['status'] == 'filtered':
            filtered += 1
        elif result['status'] == 'low_score':
            low_score += 1
        elif result['status'] == 'collected':
            collected += 1
        
        print(f"  -> {result['status']}: {result['reason']} (score: {result['score']})")
    
    # Write report
    report = {
        'total': total,
        'filtered': filtered,
        'low_score': low_score,
        'collected': collected,
        'details': details
    }
    
    report_path = DATA_DIR / 'llm-process-report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== SUMMARY ===")
    print(f"Total: {total}")
    print(f"Filtered: {filtered}")
    print(f"Low Score: {low_score}")
    print(f"Collected: {collected}")
    print(f"Report saved to: {report_path}")
    
    # Output the report JSON for validation
    print("\n=== REPORT JSON ===")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
