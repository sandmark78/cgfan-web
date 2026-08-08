#!/usr/bin/env python3
"""
Process all tweets from /tmp/tweets_batch.json
- Filter out non-prompt tweets
- Extract clean prompts
- Generate Chinese titles
- Check duplicates
- Create markdown files
- Download images
"""

import json
import re
from pathlib import Path
from datetime import datetime
import urllib.request
import time

# Paths
WORKSPACE = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
CONTENT_DIR = WORKSPACE / "content" / "prompts"
IMAGES_DIR = WORKSPACE / "public" / "images" / "prompts"
TWEETS_FILE = Path("/tmp/tweets_batch.json")

# Load tweets
with open(TWEETS_FILE, 'r', encoding='utf-8') as f:
    tweets = json.load(f)

print(f"Loaded {len(tweets)} tweets")

# ===== FILTER: Only keep tweets with images and potential prompts =====
def has_images(tweet):
    return len(tweet.get("imgs", [])) > 0

def has_prompt_content(tweet):
    """Check if tweet has actual prompt content"""
    text = tweet.get("allText", "")
    
    # Skip if too short
    if len(text) < 100:
        return False
    
    # Skip if it's just greetings/discussions without prompts
    skip_patterns = [
        r"Good (night|morning|afternoon)",
        r"watching .* at",
        r"Thank you .* for purchasing",
        r"义父.*Codex",
        r"公众号.*禁止",
        r"兄弟们.*答疑",
        r"Seedance 2\.5 is coming soon",
        r"The little imperfections",
        r"Some videos instantly",
        r"AI video is getting so good",
        r"Mission begins now",
        r"QT your Wallpaper",
    ]
    
    for pattern in skip_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return False
    
    # Check for prompt indicators
    prompt_indicators = [
        "提示词", "Prompt", "prompt", "プロンプト",
        "生成一张", "Create a", "生成", "画面",
        "人物", "构图", "光影", "色彩",
        "9:16", "4:5", "3:4", "竖版",
        "ultra detailed", "cinematic",
        "ALT", "alt",  # ALT text contains prompt
    ]
    
    for indicator in prompt_indicators:
        if indicator in text:
            return True
    
    return False

# Filter tweets
filtered_tweets = [t for t in tweets if has_images(t) and has_prompt_content(t)]
print(f"Filtered to {len(filtered_tweets)} tweets with images and prompt content")

# ===== EXTRACT PROMPT =====
def extract_prompt_from_text(text):
    """Extract clean prompt from tweet text"""
    
    # Split into ARTICLE blocks
    articles = re.split(r'===ARTICLE \d+===', text)
    
    # Find the article with the most prompt-like content
    best_article = ""
    best_score = 0
    
    for article in articles:
        if not article.strip():
            continue
        
        # Score this article based on prompt indicators
        score = 0
        prompt_indicators = [
            "提示词", "Prompt", "生成一张", "Create a",
            "人物", "构图", "光影", "色彩", "画面",
            "9:16", "4:5", "3:4", "ultra detailed", "cinematic",
            "服装", "妆容", "发型", "背景", "光线"
        ]
        
        for indicator in prompt_indicators:
            if indicator in article:
                score += article.count(indicator)
        
        # Prefer longer articles (more likely to be full prompts)
        score += len(article) / 1000
        
        if score > best_score:
            best_score = score
            best_article = article
    
    if not best_article:
        return ""
    
    # Clean the prompt
    prompt = best_article
    
    # Remove author info
    prompt = re.sub(r'@[a-zA-Z0-9_]+\n?', '', prompt)
    
    # Remove dates
    prompt = re.sub(r'\w+ \d{1,2}\n', '', prompt)
    prompt = re.sub(r'\d{1,2}:\d{2} [AP]M · \w+ \d+, \d{4}\n?', '', prompt)
    
    # Remove view/engagement counts
    prompt = re.sub(r'\d+\.?\d*K?\nViews\n', '', prompt)
    prompt = re.sub(r'\d+\n\d+\n\d+\n\d+\n?$', '', prompt, flags=re.MULTILINE)
    
    # Remove hashtags
    prompt = re.sub(r'#[\w\u4e00-\u9fff]+', '', prompt)
    
    # Remove "Made with AI"
    prompt = re.sub(r'Made with AI\n?', '', prompt)
    
    # Remove intro text before prompt
    intro_patterns = [
        r'兄弟们.*?\n',
        r'分享.*?\n',
        r'今天.*?\n',
        r'提示词[：:]\s*\n?',
        r'Prompt[：:]\s*\n?',
    ]
    
    for pattern in intro_patterns:
        prompt = re.sub(pattern, '', prompt, flags=re.IGNORECASE)
    
    # Clean up whitespace
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    prompt = prompt.strip()
    
    # If still too short or no content, return empty
    if len(prompt) < 50:
        return ""
    
    return prompt

def extract_from_alt_text(tweet):
    """Extract prompt from image ALT text"""
    for img in tweet.get("imgs", []):
        alt = img.get("alt", "")
        if alt and len(alt) > 100:
            return alt
    return ""

# ===== IDENTIFY MODEL =====
def identify_model(text):
    """Identify AI model from text"""
    text_lower = text.lower()
    
    if "gpt image 2" in text_lower or "gpt-image2" in text_lower or "chatgpt-image2" in text_lower:
        return "GPT-Image2"
    elif "midjourney" in text_lower or " mj " in text_lower:
        return "Midjourney"
    elif "gemini" in text_lower:
        return "Gemini"
    else:
        return "通用 Prompt"

# ===== GENERATE CHINESE TITLE =====
def generate_chinese_title(prompt, tweet):
    """Generate a Chinese title with visual imagery"""
    
    # Extract key elements from prompt
    keywords = []
    
    # Style keywords
    if "唐风" in prompt or "古风" in prompt:
        keywords.append("古风")
    if "新中式" in prompt:
        keywords.append("新中式")
    if "3D" in prompt or "立体" in prompt:
        keywords.append("3D")
    if "极简" in prompt:
        keywords.append("极简")
    if "海报" in prompt:
        keywords.append("海报")
    if "粘土" in prompt:
        keywords.append("粘土")
    if "剪纸" in prompt or "纸雕" in prompt:
        keywords.append("纸艺")
    if "时尚" in prompt or "fashion" in prompt.lower():
        keywords.append("时尚")
    if "人像" in prompt or "portrait" in prompt.lower():
        keywords.append("人像")
    if "产品" in prompt or "product" in prompt.lower():
        keywords.append("产品")
    if "仙侠" in prompt:
        keywords.append("仙侠")
    if "剑修" in prompt:
        keywords.append("剑修")
    if "莲灯" in prompt:
        keywords.append("莲灯")
    if "旗袍" in prompt:
        keywords.append("旗袍")
    if "线条" in prompt:
        keywords.append("线条")
    if "微缩" in prompt:
        keywords.append("微缩")
    if "排版" in prompt or "PPT" in prompt:
        keywords.append("排版")
    if "生日" in prompt:
        keywords.append("生日")
    
    # Subject keywords
    if "女子" in prompt or "女性" in prompt:
        keywords.append("女子")
    if "将军" in prompt:
        keywords.append("将军")
    if "凤冠" in prompt:
        keywords.append("凤冠")
    if "牡丹" in prompt:
        keywords.append("牡丹")
    
    # Build title
    if not keywords:
        keywords = ["创意视觉"]
    
    # Limit to 3-4 keywords
    keywords = keywords[:4]
    
    # Combine into title
    title = "".join(keywords)
    
    # Add descriptive element if too short
    if len(title) < 6:
        if "古风" in keywords:
            title += "写真"
        elif "时尚" in keywords:
            title += "摄影"
        elif "排版" in keywords:
            title += "设计"
    
    # Ensure ≤ 20 characters
    if len(title) > 20:
        title = title[:20]
    
    return title

# ===== EXTRACT TAGS =====
def extract_tags(prompt, title):
    """Extract 3-5 tags from prompt and title"""
    tags = []
    
    # From title
    tag_candidates = [
        "古风", "新中式", "3D", "极简", "海报", "粘土", "纸艺",
        "时尚", "人像", "产品", "仙侠", "剑修", "莲灯", "旗袍",
        "线条", "微缩", "排版", "生日", "女子", "将军", "凤冠",
        "牡丹", "写真", "摄影", "设计", "唐风", "东方", "CG",
        "插画", "动漫", "二次元", "立体", "剪纸"
    ]
    
    for candidate in tag_candidates:
        if candidate in prompt or candidate in title:
            tags.append(candidate)
    
    # Add style tags
    if "cinematic" in prompt.lower() or "电影" in prompt:
        tags.append("电影感")
    if "editorial" in prompt.lower():
        tags.append("编辑")
    if "商业" in prompt or "commercial" in prompt.lower():
        tags.append("商业")
    
    # Limit to 3-5 tags
    tags = list(dict.fromkeys(tags))[:5]
    
    if not tags:
        tags = ["创意", "视觉", "设计"]
    
    return tags

# ===== DETERMINE CATEGORY =====
def determine_category(prompt, title):
    """Determine category from prompt"""
    if "人像" in prompt or "portrait" in prompt.lower() or "女子" in prompt or "写真" in prompt:
        return "portrait"
    elif "产品" in prompt or "product" in prompt.lower() or "海报" in prompt:
        return "poster"
    elif "3D" in prompt or "立体" in prompt or "纸雕" in prompt or "剪纸" in prompt:
        return "3d"
    elif "插画" in prompt or "illustration" in prompt.lower() or "动漫" in prompt:
        return "illustration"
    else:
        return "poster"  # default

# ===== CHECK DUPLICATE =====
def is_duplicate(slug):
    """Check if slug already exists (also check source URL for robustness)"""
    for md_file in CONTENT_DIR.rglob("*.md"):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if f'slug: "{slug}"' in content:
            return True
        # 兼容：也检查 source URL（防止不同 slug 格式导致重复）
        if f'status/{slug}' in content and slug.isdigit():
            return True
    return False

# ===== SCORE (8 dimensions) =====
def score_prompt(prompt, tweet):
    """Score prompt on 8 dimensions (1-10 each)"""
    # Simplified scoring based on prompt quality indicators
    
    score = 0
    
    # Composition (构图)
    if "构图" in prompt or "composition" in prompt.lower():
        score += 8
    elif "全身" in prompt or "半身" in prompt:
        score += 7
    else:
        score += 6
    
    # Color (色彩)
    if "色彩" in prompt or "配色" in prompt or "color" in prompt.lower():
        score += 8
    else:
        score += 6
    
    # Lighting (光影)
    if "光影" in prompt or "光线" in prompt or "lighting" in prompt.lower():
        score += 8
    else:
        score += 6
    
    # Detail (细节)
    if len(prompt) > 500:
        score += 9  # Very detailed
    elif len(prompt) > 200:
        score += 7
    else:
        score += 5
    
    # Creativity (创意)
    if "创意" in prompt or "独特" in prompt:
        score += 8
    else:
        score += 6
    
    # Technical (技术)
    if "ultra detailed" in prompt.lower() or "8K" in prompt or "高精度" in prompt:
        score += 8
    else:
        score += 6
    
    # Aesthetic (审美)
    if "高级" in prompt or "质感" in prompt or "aesthetic" in prompt.lower():
        score += 8
    else:
        score += 6
    
    # Curation (策展)
    if "系列" in prompt or "series" in prompt.lower():
        score += 7
    else:
        score += 6
    
    return score

# ===== PROCESS EACH TWEET =====
results = []
today = datetime.now().strftime("%Y-%m-%d")
added_ts = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00'

for i, tweet in enumerate(filtered_tweets, 1):
    tweet_id = tweet.get("id")
    author = tweet.get("author", "Unknown")
    date = tweet.get("date", today)
    all_text = tweet.get("allText", "")
    
    print(f"\n[{i}/{len(filtered_tweets)}] Processing tweet {tweet_id} by {author}")
    
    # Extract prompt
    prompt = extract_prompt_from_text(all_text)
    
    # If no prompt from text, try ALT text
    if not prompt or len(prompt) < 100:
        alt_prompt = extract_from_alt_text(tweet)
        if alt_prompt:
            prompt = alt_prompt
            print(f"  ✓ Extracted from ALT text ({len(prompt)} chars)")
    
    if not prompt or len(prompt) < 100:
        print(f"  ✗ No valid prompt found, skipping")
        continue
    
    print(f"  ✓ Extracted prompt ({len(prompt)} chars)")
    
    # Identify model
    model = identify_model(all_text + prompt)
    print(f"  Model: {model}")
    
    # Generate Chinese title
    title = generate_chinese_title(prompt, tweet)
    print(f"  Title: {title}")
    
    # Extract tags
    tags = extract_tags(prompt, title)
    print(f"  Tags: {tags}")
    
    # Determine category
    category = determine_category(prompt, title)
    print(f"  Category: {category}")
    
    # Check duplicate
    slug = f"prompt-{tweet_id}"
    if is_duplicate(slug):
        print(f"  ✗ Duplicate slug {slug}, skipping")
        continue
    
    # Score
    total_score = score_prompt(prompt, tweet)
    print(f"  Score: {total_score}/80")
    
    if total_score < 65:
        print(f"  ✗ Score too low ({total_score}/80), saving as candidate")
        # 保存候选（方便人工筛选）
        from scripts.auto_collect.save_candidate import save_candidate
        save_candidate(tweet, prompt, title, model, {}, total_score, category)
        continue
    
    # Create markdown file
    output_dir = CONTENT_DIR / category
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{slug}.md"
    
    # Clean prompt for markdown (remove negative prompts)
    clean_prompt = re.sub(r'负向提示词.*$', '', prompt, flags=re.DOTALL)
    clean_prompt = re.sub(r'negative prompt.*$', '', clean_prompt, flags=re.DOTALL | re.IGNORECASE)
    clean_prompt = clean_prompt.strip()
    
    # Extract aspect ratio
    aspect_ratio = "9:16"
    if "4:5" in prompt:
        aspect_ratio = "4:5"
    elif "3:4" in prompt:
        aspect_ratio = "3:4"
    elif "1:1" in prompt:
        aspect_ratio = "1:1"
    
    # Extract style
    style = "cinematic"
    if "古风" in prompt:
        style = "古风"
    elif "新中式" in prompt:
        style = "新中式"
    elif "时尚" in prompt:
        style = "时尚"
    elif "3D" in prompt:
        style = "3D"
    
    markdown_content = f"""---
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
Style: {style}
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    
    print(f"  ✓ Created {output_path.name}")
    
    results.append({
        "tweet_id": tweet_id,
        "title": title,
        "author": author,
        "model": model,
        "score": total_score,
        "category": category,
        "slug": slug
    })

print(f"\n{'='*60}")
print(f"Processed {len(results)} prompts successfully")
print(f"{'='*60}")

# Save results summary
with open('/tmp/process_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Results saved to /tmp/process_results.json")
