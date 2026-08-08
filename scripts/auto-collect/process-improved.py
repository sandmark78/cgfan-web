#!/usr/bin/env python3
"""
Improved processor: Better titles, better scoring, process high-quality skipped tweets
"""

import json
import re
from pathlib import Path
from datetime import datetime

WORKSPACE = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
CONTENT_DIR = WORKSPACE / "content" / "prompts"
TWEETS_FILE = Path("/tmp/tweets_batch.json")

with open(TWEETS_FILE, 'r', encoding='utf-8') as f:
    tweets = json.load(f)

# Load previously processed results
with open('/tmp/process_results.json', 'r', encoding='utf-8') as f:
    already_processed = json.load(f)
    
processed_ids = {r['tweet_id'] for r in already_processed}

def extract_clean_prompt(text):
    """Extract the best prompt from tweet text"""
    articles = re.split(r'===ARTICLE \d+===', text)
    
    best = ""
    best_len = 0
    
    for article in articles:
        if not article.strip():
            continue
        
        # Prefer articles with prompt indicators
        has_prompt = any(ind in article for ind in [
            "提示词", "Prompt", "生成", "Create", "画面", "人物", "构图"
        ])
        
        if has_prompt and len(article) > best_len:
            best = article
            best_len = len(article)
    
    if not best:
        # Fallback to longest article
        for article in articles:
            if len(article) > best_len:
                best = article
                best_len = len(article)
    
    # Clean
    prompt = best
    prompt = re.sub(r'@[a-zA-Z0-9_]+\n?', '', prompt)
    prompt = re.sub(r'\w+ \d{1,2}\n', '', prompt)
    prompt = re.sub(r'\d{1,2}:\d{2} [AP]M · \w+ \d+, \d{4}\n?', '', prompt)
    prompt = re.sub(r'\d+\.?\d*K?\nViews\n', '', prompt)
    prompt = re.sub(r'#[\w\u4e00-\u9fff]+\s*', '', prompt)
    prompt = re.sub(r'Made with AI\n?', '', prompt)
    prompt = re.sub(r'兄弟们.*?\n', '', prompt)
    prompt = re.sub(r'分享.*?\n', '', prompt)
    prompt = re.sub(r'提示词[：:]\s*\n?', '', prompt, flags=re.IGNORECASE)
    prompt = re.sub(r'Prompt[：:]\s*\n?', '', prompt, flags=re.IGNORECASE)
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    
    return prompt.strip()

def extract_from_alt(tweet):
    """Extract from ALT text"""
    for img in tweet.get("imgs", []):
        alt = img.get("alt", "")
        if alt and len(alt) > 100:
            return alt
    return ""

def identify_model(text):
    """Identify model"""
    text_lower = text.lower()
    if "gpt image 2" in text_lower or "gpt-image2" in text_lower or "chatgpt-image2" in text_lower:
        return "GPT-Image2"
    elif "midjourney" in text_lower or " mj " in text_lower:
        return "Midjourney"
    elif "gemini" in text_lower:
        return "Gemini"
    return "通用 Prompt"

def generate_title(prompt, author):
    """Generate visual Chinese title"""
    
    # Extract key visual elements
    elements = []
    
    # Style
    if "唐风" in prompt or "盛唐" in prompt:
        elements.append("盛唐")
    elif "古风" in prompt:
        elements.append("古风")
    if "新中式" in prompt:
        elements.append("新中式")
    if "仙侠" in prompt:
        elements.append("仙侠")
    if "剑修" in prompt:
        elements.append("剑修")
    if "莲灯" in prompt:
        elements.append("莲灯")
    if "凤冠" in prompt:
        elements.append("凤冠")
    if "牡丹" in prompt:
        elements.append("牡丹")
    if "旗袍" in prompt:
        elements.append("旗袍")
    
    # Subject
    if "女子" in prompt or "女性" in prompt:
        if "将军" in prompt:
            elements.append("女将")
        elif "剑修" in prompt:
            elements.append("剑修女主")
        elif "贵女" in prompt:
            elements.append("贵女")
        else:
            elements.append("女子")
    
    # Technique
    if "3D" in prompt or "立体" in prompt:
        elements.append("3D")
    if "剪纸" in prompt or "纸雕" in prompt:
        elements.append("纸艺")
    if "粘土" in prompt:
        elements.append("粘土")
    if "线条" in prompt:
        elements.append("线条")
    
    # Format
    if "海报" in prompt:
        elements.append("海报")
    elif "写真" in prompt:
        elements.append("写真")
    elif "人像" in prompt:
        elements.append("人像")
    
    # Build title
    if not elements:
        # Fallback: extract from first sentence
        first_line = prompt.split('\n')[0][:20]
        return first_line if first_line else "创意视觉"
    
    title = "".join(elements[:4])
    
    # Ensure ≤ 20 chars
    if len(title) > 20:
        title = title[:20]
    
    return title

def extract_tags(prompt, title):
    """Extract 3-5 tags"""
    tags = []
    
    candidates = [
        "古风", "新中式", "3D", "极简", "海报", "粘土", "纸艺",
        "时尚", "人像", "产品", "仙侠", "剑修", "莲灯", "旗袍",
        "线条", "微缩", "排版", "生日", "女子", "将军", "凤冠",
        "牡丹", "写真", "摄影", "设计", "唐风", "东方", "CG",
        "插画", "动漫", "二次元", "立体", "剪纸", "盛唐", "仙侠"
    ]
    
    for c in candidates:
        if c in prompt or c in title:
            tags.append(c)
    
    if "cinematic" in prompt.lower() or "电影" in prompt:
        tags.append("电影感")
    if "editorial" in prompt.lower():
        tags.append("编辑")
    
    return list(dict.fromkeys(tags))[:5] or ["创意", "视觉"]

def determine_category(prompt, title):
    """Determine category"""
    if "人像" in prompt or "portrait" in prompt.lower() or "女子" in prompt or "写真" in prompt:
        return "portrait"
    elif "产品" in prompt or "product" in prompt.lower():
        return "poster"
    elif "3D" in prompt or "立体" in prompt or "纸雕" in prompt or "剪纸" in prompt:
        return "3d"
    elif "插画" in prompt or "illustration" in prompt.lower():
        return "illustration"
    return "poster"

def is_duplicate(slug):
    """Check duplicate (also check source URL for robustness)"""
    for md_file in CONTENT_DIR.rglob("*.md"):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if f'slug: "{slug}"' in content:
            return True
        # 兼容：也检查 source URL（防止不同 slug 格式导致重复）
        if f'status/{slug}' in content and slug.isdigit():
            return True
    return False

def score_prompt(prompt):
    """Better scoring"""
    score = 0
    
    # Length bonus (detailed prompts are better)
    if len(prompt) > 1000:
        score += 9
    elif len(prompt) > 500:
        score += 7
    else:
        score += 5
    
    # Composition
    if "构图" in prompt or "composition" in prompt.lower():
        score += 8
    elif "全身" in prompt or "半身" in prompt:
        score += 7
    else:
        score += 6
    
    # Color
    if "色彩" in prompt or "配色" in prompt or "color" in prompt.lower():
        score += 8
    else:
        score += 6
    
    # Lighting
    if "光影" in prompt or "光线" in prompt or "lighting" in prompt.lower():
        score += 8
    else:
        score += 6
    
    # Detail
    if "ultra detailed" in prompt.lower() or "8K" in prompt or "高精度" in prompt:
        score += 9
    elif "详细" in prompt or "detailed" in prompt.lower():
        score += 7
    else:
        score += 5
    
    # Creativity
    if "创意" in prompt or "独特" in prompt:
        score += 8
    else:
        score += 6
    
    # Technical
    if "cinematic" in prompt.lower() or "电影" in prompt:
        score += 8
    else:
        score += 6
    
    # Aesthetic
    if "高级" in prompt or "质感" in prompt:
        score += 8
    else:
        score += 6
    
    return score

# Process high-quality tweets that were skipped
today = datetime.now().strftime("%Y-%m-%d")
added_ts = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00'
new_results = []

for tweet in tweets:
    tweet_id = tweet.get("id")
    
    # Skip already processed
    if tweet_id in processed_ids:
        continue
    
    all_text = tweet.get("allText", "")
    author = tweet.get("author", "Unknown")
    date = tweet.get("date", today)
    
    # Extract prompt
    prompt = extract_clean_prompt(all_text)
    if not prompt or len(prompt) < 100:
        alt = extract_from_alt(tweet)
        if alt:
            prompt = alt
    
    if not prompt or len(prompt) < 100:
        continue
    
    # Score
    total_score = score_prompt(prompt)
    
    # Only process high-quality (≥58)
    if total_score < 58:
        continue
    
    # Generate title
    title = generate_title(prompt, author)
    
    # Skip generic titles
    if title in ["创意视觉", "线条", "人像"]:
        continue
    
    # Extract metadata
    tags = extract_tags(prompt, title)
    category = determine_category(prompt, title)
    model = identify_model(all_text + prompt)
    slug = f"prompt-{tweet_id}"
    
    # Check duplicate
    if is_duplicate(slug):
        continue
    
    # Clean prompt
    clean_prompt = re.sub(r'负向提示词.*$', '', prompt, flags=re.DOTALL)
    clean_prompt = re.sub(r'negative prompt.*$', '', clean_prompt, flags=re.DOTALL | re.IGNORECASE)
    
    # Extract aspect ratio
    aspect_ratio = "9:16"
    if "4:5" in prompt:
        aspect_ratio = "4:5"
    elif "3:4" in prompt:
        aspect_ratio = "3:4"
    
    # Create markdown
    output_dir = CONTENT_DIR / category
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{slug}.md"
    
    markdown = f"""---
title: "{title}"
slug: "{slug}"
tags: {json.dumps(tags, ensure_ascii=False)}
category: "{category}"
model: "{model}"
author: "{author}"
date: "{date}"
added: "{added_ts}"
source: "https://x.com/i/status/{tweet_id}"
cover: "/images/prompts/{slug}.jpg"
---

{clean_prompt}

Aspect ratio: {aspect_ratio}
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown)
    
    print(f"✓ Created {slug}: {title} ({total_score}/80)")
    
    new_results.append({
        "tweet_id": tweet_id,
        "title": title,
        "author": author,
        "model": model,
        "score": total_score,
        "category": category,
        "slug": slug
    })

print(f"\nCreated {len(new_results)} additional prompts")

# Combine results
all_results = already_processed + new_results
with open('/tmp/process_results.json', 'w', encoding='utf-8') as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"Total: {len(all_results)} prompts")
