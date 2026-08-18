#!/usr/bin/env python3
import json, subprocess
from pathlib import Path

data = json.load(open('data/auto-collect/preprocessed.json'))
IMAGES_DIR = Path('public/images/prompts')

# Download missing images for idx 3, 37, 38
for idx in [3, 37, 38]:
    item = data[idx]
    tid = item['tweet_id']
    urls = item.get('image_urls', [])
    print(f'[{idx}] tid={tid} urls={len(urls)}')
    for i, url in enumerate(urls):
        url = url.replace('format=webp', 'format=jpg')
        if 'format=' not in url:
            url += '&format=jpg' if '?' in url else '?format=jpg'
        if i == 0:
            fn = f'prompt-{tid}.jpg'
        else:
            fn = f'prompt-{tid}-{i+1}.jpg'
        save = IMAGES_DIR / fn
        if save.exists() and save.stat().st_size > 0:
            print(f'  {fn} exists')
            continue
        r = subprocess.run(['curl', '-sL', '--connect-timeout', '5', '--max-time', '10', '-o', str(save), url], timeout=15)
        if save.exists() and save.stat().st_size > 0:
            print(f'  {fn} OK ({save.stat().st_size} bytes)')
        else:
            print(f'  {fn} FAIL')
