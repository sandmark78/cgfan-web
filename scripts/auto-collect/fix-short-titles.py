#!/usr/bin/env python3
"""Fix short/generic titles for today's collected items."""
import os
import sys
import json
import re
from datetime import datetime

os.chdir('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')
sys.path.insert(0, 'scripts')

from supabase_utils import get_client

today = datetime.now().strftime('%Y-%m-%d')
today_dir = f'content/prompts/{today.replace("-", "/")}'

# Generic/short title patterns
BAD_TITLES = {'海报', '肖像', '字体', '插画', '写真', '设计'}
SHORT_THRESHOLD = 10

def is_bad_title(title):
    """Check if title is too short or generic."""
    if not title:
        return True
    if title in BAD_TITLES:
        return True
    if len(title) <= SHORT_THRESHOLD:
        # Allow if it has meaningful content (e.g., "月亮·电影感" is borderline ok at 6)
        # But pure generic like "海报" "肖像" are bad
        if '·' in title and len(title) > 5:
            return False  # "肖像·复古" style is borderline, let's keep if > 5
        return True
    if title.startswith('Create a'):
        return True  # Truncated English prompt
    return False

def generate_title_from_prompt(prompt_text, author=''):
    """Generate a better title from prompt content."""
    # Extract key visual elements from the prompt
    prompt_lower = prompt_text.lower()
    
    # Style keywords mapping
    style_map = {
        'film': '胶片风', '35mm': '胶片风', 'kodak': '胶片风', 'fuji': '胶片风',
        'watercolor': '水彩风', 'watercolour': '水彩风',
        'oil painting': '油画风', 'oilpainting': '油画风',
        'cyberpunk': '赛博朋克', 'neon': '霓虹风',
        'minimalist': '极简风', 'minimal': '极简风',
        'vintage': '复古风', 'retro': '复古风', '70s': '七十年代', '80s': '八十年代',
        'anime': '动漫风', 'manga': '漫画风',
        'photorealistic': '写实风', 'realistic': '写实风',
        'surreal': '超现实', 'dreamlike': '梦幻风',
        'portrait': '肖像', 'landscape': '风景',
        'architecture': '建筑', 'architectural': '建筑',
        'fashion': '时尚', 'editorial': '杂志风',
        'cinematic': '电影感', 'movie': '电影感',
        'studio ghibli': '吉卜力风', 'ghibli': '吉卜力风',
        'pixel art': '像素风', 'pixelart': '像素风',
        '3d render': '3D渲染', 'blender': '3D风',
        'typography': '字体设计', 'lettering': '字体设计',
        'collage': '拼贴风', 'montage': '拼贴风',
        'japanese': '日式', 'chinese': '中式', 'korean': '韩系',
        'golden hour': '黄金时刻', 'sunset': '日落',
        'dark': '暗黑风', 'moody': '情绪风',
        'pastel': '粉彩风', 'soft': '柔和风',
        'hdr': 'HDR', 'high dynamic': 'HDR',
        'macro': '微距', 'close-up': '特写',
        'aerial': '航拍', 'drone': '航拍',
        'underwater': '水下',
        'space': '太空', 'galaxy': '星河', 'cosmic': '宇宙',
        'nature': '自然', 'forest': '森林', 'ocean': '海洋',
        'flower': '花卉', 'botanical': '植物',
        'food': '美食', 'culinary': '美食',
        'street': '街拍', 'urban': '都市',
        'abstract': '抽象', 'geometric': '几何',
    }
    
    # Subject detection
    subject_keywords = {
        'girl': '少女', 'woman': '女性', 'man': '男性', 'person': '人物',
        'cat': '猫咪', 'dog': '狗狗', 'animal': '动物',
        'city': '城市', 'building': '建筑', 'house': '房屋',
        'car': '汽车', 'vehicle': '载具',
        'moon': '月亮', 'sun': '太阳', 'star': '星空',
        'mountain': '山岳', 'river': '河流', 'sea': '海洋',
        'tree': '树木', 'garden': '花园',
    }
    
    detected_styles = []
    for kw, zh in style_map.items():
        if kw in prompt_lower:
            if zh not in detected_styles:
                detected_styles.append(zh)
            if len(detected_styles) >= 2:
                break
    
    detected_subject = None
    for kw, zh in subject_keywords.items():
        if kw in prompt_lower:
            detected_subject = zh
            break
    
    # Build title
    if detected_subject and detected_styles:
        title = f"{detected_styles[0]}的{detected_subject}{detected_styles[1] if len(detected_styles) > 1 else ''}"
    elif detected_styles:
        title = '与'.join(detected_styles[:2]) + '视觉'
    elif detected_subject:
        title = f"写意{detected_subject}"
    else:
        # Fallback: extract first meaningful phrase
        # Try to find Chinese text
        chinese_parts = re.findall(r'[\u4e00-\u9fff]{2,}', prompt_text)
        if chinese_parts:
            title = chinese_parts[0][:15]
        else:
            # Take first few meaningful English words
            words = re.findall(r'[A-Za-z]{3,}', prompt_text)
            if words:
                title = ' '.join(words[:3])[:20]
            else:
                title = '视觉创意'
    
    return title

# Read today's markdown files
if not os.path.exists(today_dir):
    print(f"No directory for today: {today_dir}")
    sys.exit(0)

md_files = [f for f in os.listdir(today_dir) if f.endswith('.md')]
print(f"Found {len(md_files)} markdown files for today")

# Find items with bad titles
bad_items = []
for md_file in md_files:
    filepath = os.path.join(today_dir, md_file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse frontmatter
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            fm = parts[1]
            body = parts[2]
            # Extract title
            title_match = re.search(r'^title:\s*(.+)$', fm, re.MULTILINE)
            slug_match = re.search(r'^slug:\s*(.+)$', fm, re.MULTILINE)
            prompt_match = re.search(r'^prompt:\s*["\']?(.+?)["\']?\s*$', fm, re.MULTILINE)
            
            if title_match and slug_match:
                title = title_match.group(1).strip().strip('"\'')
                slug = slug_match.group(1).strip()
                prompt_text = prompt_match.group(1).strip() if prompt_match else body[:500]
                
                if is_bad_title(title):
                    bad_items.append({
                        'file': filepath,
                        'slug': slug,
                        'old_title': title,
                        'prompt': prompt_text,
                        'fm': fm,
                        'body': body
                    })

print(f"\nFound {len(bad_items)} items with bad titles:")
for item in bad_items:
    print(f"  - '{item['old_title']}' ({len(item['old_title'])} chars) | {item['slug']}")

if not bad_items:
    print("\nAll titles look good!")
    sys.exit(0)

# Generate new titles
print("\n--- Generating new titles ---")
client = get_client()
fixed_count = 0

for item in bad_items:
    new_title = generate_title_from_prompt(item['prompt'])
    print(f"  '{item['old_title']}' → '{new_title}'")
    
    # Update markdown file
    filepath = item['file']
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace title in frontmatter
    new_content = re.sub(
        r'^(title:\s*).+$',
        f'\\1"{new_title}"',
        content,
        flags=re.MULTILINE
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    # Update Supabase
    try:
        client.table('prompts').update({'title': new_title}).eq('slug', item['slug']).execute()
        fixed_count += 1
    except Exception as e:
        print(f"    ⚠️ Supabase update failed: {e}")

print(f"\n✅ Fixed {fixed_count}/{len(bad_items)} titles")
