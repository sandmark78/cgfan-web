#!/usr/bin/env python3
"""Download images for entries 3 and 13"""
import json
import urllib.request
from pathlib import Path

with open('data/auto-collect/preprocessed.json', 'r') as f:
    data = json.load(f)

download_dir = Path('public/images/prompts')

for idx in [3, 13]:
    entry = data[idx]
    tweet_id = entry['tweet_id']
    image_urls = entry.get('image_urls', [])

    print(f"Downloading images for tweet {tweet_id}...")

    for img_idx, url in enumerate(image_urls):
        if img_idx == 0:
            filename = f"prompt-{tweet_id}.jpg"
        else:
            filename = f"prompt-{tweet_id}-{img_idx+1}.jpg"
        
        filepath = download_dir / filename
        
        if filepath.exists():
            print(f"  ✓ {filename} already exists")
            continue
        
        try:
            download_url = url.replace('format=webp', 'format=jpg')
            req = urllib.request.Request(download_url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
            })
            
            with urllib.request.urlopen(req, timeout=30) as response:
                with open(filepath, 'wb') as f:
                    f.write(response.read())
            
            size = filepath.stat().st_size
            print(f"  ✓ {filename} ({size} bytes)")
            
        except Exception as e:
            print(f"  ✗ Failed: {e}")

print("\n✅ Done")
