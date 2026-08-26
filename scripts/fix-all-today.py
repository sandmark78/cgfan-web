#!/usr/bin/env python3
"""
从 tweets_batch.json 回填所有今日 markdown 的 authorLink、source、prompt
一次性修复所有问题
"""
import json, re
from pathlib import Path

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
TWEETS = WORKDIR / "data/auto-collect/tweets_batch.json"
CONTENT_DIR = WORKDIR / "content/prompts/2026/08/26"

with open(TWEETS, 'r', encoding='utf-8') as f:
    tweets = json.load(f)

tweet_map = {item['id']: item for item in tweets}

def extract_clean_prompt(alltext):
    """从 allText 提取干净的 prompt"""
    # 提取 ARTICLE 0
    m = re.search(r'===ARTICLE 0===\s*(.*?)(?====ARTICLE|$)', alltext, re.DOTALL)
    if not m:
        return None
    
    text = m.group(1)
    
    # 策略1: "提示词Prompt：" / "prompt：" 标记后的内容
    pm = re.search(r'(?:提示词Prompt|prompt)[：:]\s*\n?(.*?)(?=\n\s*(?:提示词Prompt|prompt)[：:]|\Z)', text, re.DOTALL | re.IGNORECASE)
    if pm and len(pm.group(1).strip()) > 100:
        return clean_text(pm.group(1).strip())
    
    # 策略2: 中文 prompt 特征
    cn = re.search(r'(请将我上传[^\n]*\n(?:[^\n]+\n)*)', text)
    if cn and len(cn.group(1)) > 100:
        return clean_text(cn.group(1).strip())
    
    # 策略3: 英文 prompt 特征
    en = re.search(r'((?:Create|A |The |Generate|Make|Build)[^\n]*\n(?:[^\n]+\n){2,})', text)
    if en and len(en.group(1)) > 100:
        return clean_text(en.group(1).strip())
    
    # 策略4: MJ 参数
    if '--ar' in text or '--v' in text:
        lines = [l for l in text.split('\n') if any(p in l for p in ['--ar', '--v', '--sref', '--stylize'])]
        if lines:
            return '\n'.join(lines).strip()
    
    # 策略5: 检查 ARTICLE 1+（评论区）
    for i in range(1, 10):
        am = re.search(rf'===ARTICLE {i}===\s*(.*?)(?====ARTICLE|$)', alltext, re.DOTALL)
        if not am:
            break
        at = am.group(1)
        if '--ar' in at or '--v' in at:
            lines = [l for l in at.split('\n') if any(p in l for p in ['--ar', '--v', '--sref', '--stylize'])]
            if lines:
                return '\n'.join(lines).strip()
        pm2 = re.search(r'(?:提示词Prompt|prompt)[：:]\s*\n?(.*?)(?=\n\s*(?:提示词Prompt|prompt)[：:]|\Z)', at, re.DOTALL | re.IGNORECASE)
        if pm2 and len(pm2.group(1).strip()) > 100:
            return clean_text(pm2.group(1).strip())
        en2 = re.search(r'((?:Create|A |The )[^\n]*\n(?:[^\n]+\n){2,})', at)
        if en2 and len(en2.group(1)) > 100:
            return clean_text(en2.group(1).strip())
    
    return None

def clean_text(text):
    """删除杂文"""
    lines = text.split('\n')
    clean = []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if re.match(r'^[A-Za-z\u4e00-\u9fff\s·\-]+$', s) and len(s) < 30:
            continue
        if s.startswith('@'):
            continue
        if re.match(r'^\d+:\d+\s*(AM|PM)\s*·', s):
            continue
        if re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+', s):
            continue
        if re.match(r'^\d+[dhm]\s*$', s):
            continue
        if re.match(r'^[\d,.]+[KMB]?\s*$', s):
            continue
        if 'Views' in s or 'Made with' in s or 'Prompt below' in s:
            continue
        if '===ARTICLE' in s or s == 'Show more':
            continue
        clean.append(line)
    return '\n'.join(clean).strip()

fixed = 0
skipped = []

for md_file in sorted(CONTENT_DIR.glob("prompt-*.md")):
    content = md_file.read_text(encoding='utf-8')
    original = content
    
    # 提取 slug
    slug_m = re.search(r'slug:\s*["\']?([^"\'\n]+)["\']?', content)
    if not slug_m:
        continue
    slug = slug_m.group(1).strip()
    tweet_id = slug.replace('prompt-', '')
    
    if tweet_id not in tweet_map:
        skipped.append(f"{md_file.name}: tweet_id not found")
        continue
    
    tweet = tweet_map[tweet_id]
    
    # 1. 修复 authorLink
    correct_author_link = tweet.get('authorLink', '')
    if correct_author_link:
        content = re.sub(r'authorLink:\s*""', f'authorLink: "{correct_author_link}"', content)
        content = re.sub(r'authorLink:\s*$', f'authorLink: "{correct_author_link}"', content, flags=re.MULTILINE)
    
    # 2. 修复 source
    correct_source = f"https://x.com/i/status/{tweet_id}"
    content = re.sub(r'source:\s*""', f'source: "{correct_source}"', content)
    content = re.sub(r'source:\s*$', f'source: "{correct_source}"', content, flags=re.MULTILINE)
    
    # 3. 修复 prompt
    alltext = tweet.get('allText', '')
    clean_prompt = extract_clean_prompt(alltext)
    
    # 也检查图片 ALT
    if not clean_prompt or len(clean_prompt) < 100:
        for img in tweet.get('imgs', []):
            alt = img.get('alt', '')
            if len(alt) > 100:
                clean_prompt = clean_text(alt)
                break
    
    if clean_prompt and len(clean_prompt) > 50:
        # 替换 ## Prompt 部分
        new_prompt_section = f"## Prompt\n\n{clean_prompt}\n"
        content = re.sub(r'## Prompt\s*\n.*?(?=\n## |\Z)', new_prompt_section, content, flags=re.DOTALL)
    else:
        skipped.append(f"{md_file.name}: no valid prompt found")
    
    if content != original:
        md_file.write_text(content, encoding='utf-8')
        fixed += 1
        print(f"✅ {md_file.name}")
        if correct_author_link:
            print(f"   authorLink: {correct_author_link}")
        print(f"   source: {correct_source}")
        if clean_prompt:
            print(f"   prompt: {len(clean_prompt)} 字符")

print(f"\n✅ 修复: {fixed} 个文件")
if skipped:
    print(f"⚠️ 跳过: {len(skipped)} 个")
    for s in skipped:
        print(f"   {s}")
