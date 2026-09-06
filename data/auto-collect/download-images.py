#!/usr/bin/env python3
"""Download images for selected tweets"""
import json, os, subprocess

os.chdir('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')

# Load preprocessed data
d = json.load(open('data/auto-collect/preprocessed.json'))

# Items to download (indices of selected items)
selected = [1, 4, 8, 12, 14, 16, 18, 25]

for idx in selected:
    t = d[idx]
    src = t.get('source', '')
    tid = src.split('/')[-1] if src else None
    if not tid:
        continue
    
    imgs = t.get('image_urls', [])
    for j, url in enumerate(imgs[:4]):  # Max 4 images
        if j == 0:
            filename = f"prompt-{tid}.jpg"
        else:
            filename = f"prompt-{tid}-{j+1}.jpg"
        
        filepath = f"public/images/prompts/{filename}"
        
        # Check if already exists
        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
            print(f"Already exists: {filename}")
            continue
        
        # Download with forced JPG format
        url_clean = url.replace('format=webp', 'format=jpg')
        if 'format=' not in url_clean:
            url_clean += '&format=jpg' if '?' in url_clean else '?format=jpg'
        
        cmd = f'curl -sL -o "{filepath}" "{url_clean}"'
        os.system(cmd)
        
        # Check if downloaded
        if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
            # Check if WebP
            result = subprocess.run(['file', filepath], capture_output=True, text=True)
            if 'WebP' in result.stdout or 'webp' in result.stdout.lower():
                # Convert to JPEG
                subprocess.run(['sips', '-s', 'format', 'jpeg', filepath, '--out', filepath], capture_output=True)
                print(f"Converted WebP->JPEG: {filename}")
            else:
                print(f"Downloaded: {filename}")
        else:
            print(f"Failed: {filename}")

print("\nDone!")
