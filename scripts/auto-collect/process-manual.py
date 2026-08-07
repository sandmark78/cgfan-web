#!/usr/bin/env python3
"""
Process remaining high-quality tweets with manual title generation
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

with open('/tmp/process_results.json', 'r', encoding='utf-8') as f:
    already_processed = json.load(f)
    
processed_ids = {r['tweet_id'] for r in already_processed}

def extract_clean_prompt(text):
    articles = re.split(r'===ARTICLE \d+===', text)
    best = max([a for a in articles if a.strip()], key=len, default="")
    
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
    for img in tweet.get("imgs", []):
        alt = img.get("alt", "")
        if alt and len(alt) > 100:
            return alt
    return ""

def identify_model(text):
    text_lower = text.lower()
    if "gpt image 2" in text_lower or "gpt-image2" in text_lower or "chatgpt-image2" in text_lower:
        return "GPT-Image2"
    elif "midjourney" in text_lower or " mj " in text_lower:
        return "Midjourney"
    elif "gemini" in text_lower:
        return "Gemini"
    return "通用 Prompt"

def is_duplicate(slug):
    for md_file in CONTENT_DIR.rglob("*.md"):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if f'slug: "{slug}"' in content:
            return True
    return False

# Manual title mapping for high-quality tweets
manual_titles = {
    "2082069258612134301": ("时尚人像层叠视觉", ["时尚", "人像", "摄影", "电影感"], "portrait"),
    "2083122655733895563": ("光影残像人像海报", ["光影", "人像", "摄影", "电影感"], "portrait"),
    "2083184235230486557": ("旗袍花枝人像写真", ["旗袍", "人像", "写真", "新中式"], "portrait"),
    "2082141535056048180": ("新中式裤装女子海报", ["新中式", "女子", "海报", "时尚"], "poster"),
    "2082420884548071527": ("电影感人像摄影", ["人像", "摄影", "电影感"], "portrait"),
    "2083215767806566700": ("3D立体纸艺海报", ["3D", "纸艺", "海报", "立体"], "3d"),
    "2082783265497162016": ("电影感人像摄影", ["人像", "摄影", "电影感"], "portrait"),
    "2082967135614021849": ("古风3D人像海报", ["古风", "3D", "人像", "海报"], "portrait"),
    "2083100382784327829": ("人像摄影海报", ["人像", "摄影", "海报"], "portrait"),
    "2083033777052553483": ("3D人像视觉海报", ["3D", "人像", "海报"], "poster"),
    "2082419067722604915": ("时尚编辑人像海报", ["时尚", "编辑", "人像", "海报"], "portrait"),
}

today = datetime.now().strftime("%Y-%m-%d")
added_ts = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00'
new_results = []

for tweet in tweets:
    tweet_id = tweet.get("id")
    
    if tweet_id in processed_ids:
        continue
    
    if tweet_id not in manual_titles:
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
    
    # Get manual metadata
    title, tags, category = manual_titles[tweet_id]
    model = identify_model(all_text + prompt)
    slug = f"prompt-{tweet_id}"
    
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
    
    print(f"✓ Created {slug}: {title}")
    
    new_results.append({
        "tweet_id": tweet_id,
        "title": title,
        "author": author,
        "model": model,
        "score": 65,
        "category": category,
        "slug": slug
    })

print(f"\nCreated {len(new_results)} additional prompts")

# Combine results
all_results = already_processed + new_results
with open('/tmp/process_results.json', 'w', encoding='utf-8') as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"Total: {len(all_results)} prompts")
