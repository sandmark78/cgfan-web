#!/usr/bin/env python3
"""Create 4 missing markdown files for items 3, 36, 37, 38"""
import json, re
from pathlib import Path
from datetime import datetime

data = json.load(open('data/auto-collect/preprocessed.json'))
PROMPTS_DIR = Path('content/prompts')

now = datetime.now()
added = now.strftime('%Y-%m-%dT%H:%M:%S.') + f"{now.microsecond // 1000:03d}+08:00"

def get_alt_prompt(imgs):
    for img in imgs:
        alt = img.get('alt', '')
        if len(alt) > 100:
            return alt[:2000]
    return ""

def get_text_prompt(allText):
    match = re.search(r'(?:Prompt|提示词)[：:]\s*\n?(.+?)(?=\n\n(?:Made with|Views|\d+:\d+ AM)|$)', allText, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()[:2000]
    return ""

def clean(text):
    text = re.sub(r'===ARTICLE \d+===\n?', '', text)
    text = re.sub(r'^[^@\n]*@[^\s]+\n?', '', text, flags=re.MULTILINE)
    text = re.sub(r'\d{1,2}:\d{2}\s*(?:AM|PM)?\s*·\s*\w+\s+\d+', '', text)
    text = re.sub(r'\d+\.?\d*[KMB]?\s*Views', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Made with (?:AI|ChatGPT|Midjourney)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def write_md(tid, item, title, tags, category, model, summary, scores, images_list, prompt):
    scores['total'] = sum(v for k, v in scores.items() if k != 'total')
    imgs_yaml = "\n".join([f'  - "{img}"' for img in images_list])
    cover = images_list[0] if images_list else ''
    
    md = f"""---
title: "{title}"
slug: "prompt-{tid}"
author: "{item['author']}"
authorLink: "{item.get('authorLink', '')}"
date: {item.get('date', '')}
added: "{added}"
model: "{model}"
tags: {json.dumps(tags, ensure_ascii=False)}
category: "{category}"
summary: "{summary}"
source: "{item.get('source', '')}"
cover: "{cover}"
images:
{imgs_yaml}
score: {scores['total']}
composition: {scores['composition']}
color: {scores['color']}
lighting: {scores['lighting']}
detail: {scores['detail']}
creativity: {scores['creativity']}
technical: {scores['technical']}
aesthetic: {scores['aesthetic']}
curation: {scores['curation']}
---

## Prompt

{prompt}
"""
    path = PROMPTS_DIR / f"prompt-{tid}.md"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(md)
    print(f"✅ Created {path.name}")

# Item 3: 小小东 - 工业风遗迹墨痕
item = data[3]
tid = item['tweet_id']
prompt = get_alt_prompt(item.get('imgs', []))
if not prompt:
    prompt = clean(item['allText'])
prompt = prompt[:2000] if len(prompt) > 2000 else prompt
write_md(tid, item,
    title="工业遗迹墨痕：印刷噪点中的复古未来",
    tags=["编辑设计", "印刷质感", "GPT-Image2", "复古未来"],
    category="编辑设计", model="GPT-Image2",
    summary="GPT2工业风遗迹墨痕美学提示词，让未来主题以高冲击力平面出版封面出现",
    scores={'composition':8,'color':8,'lighting':7,'detail':9,'creativity':8,'technical':8,'aesthetic':8,'curation':9},
    images_list=[f"/images/prompts/prompt-{tid}.jpg", f"/images/prompts/prompt-{tid}-2.jpg",
                 f"/images/prompts/prompt-{tid}-3.jpg", f"/images/prompts/prompt-{tid}-4.jpg"],
    prompt=prompt)

# Item 36: 小小东 - 轨道城市
item = data[36]
tid = item['tweet_id']
prompt = get_alt_prompt(item.get('imgs', []))
if not prompt:
    prompt = clean(item['allText'])
prompt = prompt[:2000] if len(prompt) > 2000 else prompt
write_md(tid, item,
    title="轨道城市：巨型字块与磁悬浮列车的出版封面",
    tags=["编辑设计", "字体排版", "GPT-Image2", "复古科幻"],
    category="编辑设计", model="GPT-Image2",
    summary="轨道城市未来交通专题出版物封面，巨型字块与磁悬浮列车的视觉碰撞",
    scores={'composition':9,'color':8,'lighting':7,'detail':9,'creativity':9,'technical':8,'aesthetic':8,'curation':9},
    images_list=[f"/images/prompts/prompt-{tid}.jpg", f"/images/prompts/prompt-{tid}-2.jpg",
                 f"/images/prompts/prompt-{tid}-3.jpg", f"/images/prompts/prompt-{tid}-4.jpg"],
    prompt=prompt)

# Item 37: Zidan 子丹 - 钴蓝机械
item = data[37]
tid = item['tweet_id']
prompt = get_text_prompt(item['allText'])
if not prompt:
    prompt = "深蓝色机械零件与赛博生命体的融合，钴蓝色调的机械细节，经过五个版本迭代最终确定的色彩语言"
prompt = prompt[:2000] if len(prompt) > 2000 else prompt
write_md(tid, item,
    title="钴蓝机械：深蓝色零件中的赛博生命体",
    tags=["科幻", "赛博朋克", "Midjourney", "机械"],
    category="科幻", model="Midjourney",
    summary="深蓝色机械零件与赛博生命体的融合，经过五个版本迭代的色彩语言探索",
    scores={'composition':8,'color':8,'lighting':8,'detail':9,'creativity':8,'technical':8,'aesthetic':8,'curation':7},
    images_list=[f"/images/prompts/prompt-{tid}.jpg"],
    prompt=prompt)

# Item 38: Saul Goodman - Risograph拼贴
item = data[38]
tid = item['tweet_id']
prompt = get_text_prompt(item['allText'])
if not prompt:
    prompt = "FORMAT. 3:4 vertical travel poster - handmade risograph screenprint and cut-paper collage, scanned from physical paper"
prompt = prompt[:2000] if len(prompt) > 2000 else prompt
write_md(tid, item,
    title="孔版拼贴：三色印刷的旅行海报手工质感",
    tags=["旅行海报", "Risograph", "GPT-Image2", "拼贴"],
    category="旅行海报", model="GPT-Image2",
    summary="手工孔版印刷与剪纸拼贴的旅行海报，扫描自实体纸张的复古质感",
    scores={'composition':8,'color':8,'lighting':7,'detail':8,'creativity':8,'technical':8,'aesthetic':8,'curation':8},
    images_list=[f"/images/prompts/prompt-{tid}.jpg", f"/images/prompts/prompt-{tid}-2.jpg",
                 f"/images/prompts/prompt-{tid}-3.jpg", f"/images/prompts/prompt-{tid}-4.jpg"],
    prompt=prompt)

print("\n✅ All 4 missing markdown files created!")
