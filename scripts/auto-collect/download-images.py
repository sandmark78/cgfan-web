#!/usr/bin/env python3
"""Download images for preprocessed tweets."""

import json
import os
import sys
import requests
from pathlib import Path

def main():
    # Load preprocessed data
    with open('data/auto-collect/preprocessed.json', 'r') as f:
        data = json.load(f)
    
    # Items to process (filtered: no portrait/COS/video, has prompt)
    keep_ids = [
        '2088872896437358881',  # Larus Canus - 海报构图框架
        '2088993388460986600',  # Loriel.AI - doodle fusion fashion
        '2078072262368829730',  # Michael Rabone - Ana de Armas film
        '2087131922841379280',  # Michael Rabone - Zendaya neon
        '2088898063050117360',  # Beanie Blossom - mouse washing machine
        '2089034457852338434',  # Michael Rabone - Cthulhu
        '2089004186755092648',  # Larus Canus - IDENTITY TRACE
        '2088988526427898366',  # Loriel.AI - summer doodle
        '2088669387163369531',  # Saul Goodman - watercolor city
        '2088976148801716425',  # Larus Canus - city posters
        '2088901593836265855',  # Saul Goodman - paper cutout travel
        '2088992503433499013',  # 小小东 - 博物馆海报
        '2088989167703208234',  # LudovicCreator - Halftone Noir
        '2088428890599694477',  # 小小东 - 复古早安
        '2088951153543270681',  # Larus Canus - magazine cover
        '2088997439873425664',  # Loriel.AI - travel girl 4-panel
        '2088835863270813860',  # Saul Goodman - linocut travel
        '2088639773900759489',  # simeon-sanai - vintage travel
        '2088898567976947961',  # Michael Rabone - neon ultraviolet
        '2088918226902409478',  # simeon-sanai - vintage travel 2
    ]
    
    # Filter data
    items_to_process = [item for item in data if item['tweet_id'] in keep_ids]
    print(f"Processing {len(items_to_process)} items...")
    
    # Download images
    img_dir = Path('public/images/prompts')
    img_dir.mkdir(parents=True, exist_ok=True)
    
    for item in items_to_process:
        tid = item['tweet_id']
        urls = item.get('image_urls', [])
        if not urls:
            print(f"  ⚠️  {tid}: no images")
            continue
        
        print(f"📥 {tid}: downloading {len(urls)} images...")
        for i, url in enumerate(urls):
            # Replace webp with jpg
            url_clean = url.replace('format=webp', 'format=jpg')
            if i == 0:
                filename = f"prompt-{tid}.jpg"
            else:
                filename = f"prompt-{tid}-{i+1}.jpg"
            
            filepath = img_dir / filename
            if filepath.exists():
                continue
                
            try:
                resp = requests.get(url_clean, timeout=30)
                if resp.status_code == 200:
                    with open(filepath, 'wb') as f:
                        f.write(resp.content)
                    print(f"  ✅ {filename}")
                else:
                    print(f"  ❌ {filename}: HTTP {resp.status_code}")
            except Exception as e:
                print(f"  ❌ {filename}: {e}")
    
    print("\n✅ Image download complete")

if __name__ == '__main__':
    main()
