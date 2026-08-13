#!/usr/bin/env python3
"""
Download images for all processed prompts
"""

import json
import urllib.request
import sys
from pathlib import Path
import time

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import PROJECT_ROOT, IMAGES_DIR, TWEETS_BATCH, EVALUATED

# Load evaluated results
with open(EVALUATED, 'r', encoding='utf-8') as f:
    results = json.load(f)

# Filter only passed items
results = [r for r in results if r.get('status') == 'pass']

# Load tweets data
with open(TWEETS_BATCH, 'r', encoding='utf-8') as f:
    tweets = json.load(f)

# Create tweet ID to images mapping
tweet_images = {}
for tweet in tweets:
    tweet_id = tweet.get("id") or tweet.get("tweet_id")
    imgs = tweet.get("imgs", [])
    if imgs:
        tweet_images[str(tweet_id)] = imgs

print(f"Processing {len(results)} prompts...")
print(f"Found images for {len(tweet_images)} tweets")

# Ensure images directory exists
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

success_count = 0
fail_count = 0

for result in results:
    slug = result['slug']
    tweet_id = result['tweet_id']
    
    # Output path
    output_path = IMAGES_DIR / f"{slug}.jpg"
    
    # Skip if already exists
    if output_path.exists():
        print(f"✓ {slug}.jpg already exists")
        success_count += 1
        continue
    
    # Get images for this tweet
    if tweet_id not in tweet_images:
        print(f"✗ No images found for {slug}")
        fail_count += 1
        continue
    
    images = tweet_images[tweet_id]
    
    # Try to download first image
    img_url = images[0].get("src", "")
    if not img_url:
        print(f"✗ No valid image URL for {slug}")
        fail_count += 1
        continue
    
    # Convert webp to jpg URL
    if "format=webp" in img_url:
        img_url = img_url.replace("format=webp", "format=jpg")
    
    print(f"Downloading {slug}.jpg from {img_url[:80]}...")
    
    try:
        # Download image
        req = urllib.request.Request(
            img_url,
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            img_data = response.read()
            
            # Save to file
            with open(output_path, 'wb') as f:
                f.write(img_data)
            
            print(f"✓ Saved {slug}.jpg ({len(img_data)} bytes)")
            success_count += 1
            
        # Rate limiting
        time.sleep(0.5)
        
    except Exception as e:
        print(f"✗ Failed to download {slug}.jpg: {e}")
        fail_count += 1

print(f"\n{'='*60}")
print(f"Download complete: {success_count} success, {fail_count} failed")
print(f"{'='*60}")
