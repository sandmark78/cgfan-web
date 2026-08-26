#!/usr/bin/env python3
"""
从 tweets_batch.json 提取干净的 prompt，修复 markdown 文件
"""
import json
import re
from pathlib import Path

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
TWEETS_BATCH = WORKDIR / "data/auto-collect/tweets_batch.json"
CONTENT_DIR = WORKDIR / "content/prompts/2026/08/26"

# 读取原始推文数据
with open(TWEETS_BATCH, 'r', encoding='utf-8') as f:
    tweets = json.load(f)

# 构建 tweet_id -> data 映射
tweet_map = {item['id']: item for item in tweets}

# 需要修复的文件
files_to_fix = [
    'prompt-2091556282754842675.md',
    'prompt-2092160522711978218.md',
    'prompt-2092183407778509243.md',
    'prompt-2092209714037928401.md',
    'prompt-2092211945504178307.md',
    'prompt-2092227240389996622.md',
    'prompt-2092242842664284266.md',
    'prompt-2092243087410282632.md',
    'prompt-2092250667192668482.md',
]

def extract_clean_prompt(text):
    """从 allText 中提取干净的 prompt"""
    
    # 删除作者名和 @handle 行
    text = re.sub(r'^[^\n]*?@[a-zA-Z0-9_]+\s*$', '', text, flags=re.MULTILINE)
    
    # 删除时间戳行（如 "4:18 AM · Jul 27, 2026"）
    text = re.sub(r'^\d+:\d+\s*(AM|PM)\s*·.*$', '', text, flags=re.MULTILINE)
    
    # 删除日期行（如 "Jul 26", "Aug 24"）
    text = re.sub(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+\s*$', '', text, flags=re.MULTILINE)
    
    # 删除纯数字行（互动数据）
    text = re.sub(r'^[\d,.]+[KMB]?\s*$', '', text, flags=re.MULTILINE)
    
    # 删除 "Made with AI" 等
    text = re.sub(r'^Made with.*$', '', text, flags=re.MULTILINE)
    
    # 删除 "Views" 行
    text = re.sub(r'^\d+[\d,.]*\s*Views\s*$', '', text, flags=re.MULTILINE)
    
    # 删除 "Show more"
    text = re.sub(r'^Show more\s*$', '', text, flags=re.MULTILINE)
    
    # 尝试提取 prompt 内容
    # 策略1：查找 "提示词Prompt：" 或 "prompt：" 后面的内容
    prompt_match = re.search(
        r'(?:提示词Prompt|prompt)[：:]\s*\n?(.*?)(?=\n\s*(?:提示词Prompt|prompt)[：:]|\n\n[A-Z][^\n]*?@\Z|\Z)',
        text, re.DOTALL | re.IGNORECASE
    )
    
    if prompt_match:
        prompt_content = prompt_match.group(1).strip()
        return prompt_content
    
    # 策略2：查找 Midjourney 参数（--ar, --v, --sref）周围的描述
    if '--ar' in text or '--v' in text or '--sref' in text:
        # 提取包含参数的段落
        param_match = re.search(r'((?:[^\n]*?(?:--ar|--v|--sref|--stylize|--raw|--hd)[^\n]*\n?)+)', text)
        if param_match:
            return param_match.group(1).strip()
    
    # 策略3：查找英文 prompt 特征（如 "Create a", "A hyper-realistic"）
    create_match = re.search(r'((?:Create|A |The |Generate|Make|Build|Design|Render)[^\n]*\n(?:[^\n]+\n)*)', text)
    if create_match and len(create_match.group(1)) > 100:
        return create_match.group(1).strip()
    
    # 策略4：查找中文 prompt 特征（如 "请将我上传"、"整体采用"）
    cn_match = re.search(r'(请将我上传[^\n]*\n(?:[^\n]+\n)*)', text)
    if cn_match:
        return cn_match.group(1).strip()
    
    # 策略5：如果 allText 包含 "负面：" 或 "negative"，提取到那里
    neg_match = re.search(r'(.*?)(?:负面[：:]|negative[：:])', text, re.DOTALL | re.IGNORECASE)
    if neg_match and len(neg_match.group(1)) > 100:
        return neg_match.group(1).strip()
    
    return None

fixed_count = 0
skipped = []

for fname in files_to_fix:
    fpath = CONTENT_DIR / fname
    if not fpath.exists():
        print(f"❌ 文件不存在: {fname}")
        continue
    
    # 提取 tweet_id
    tweet_id = fname.replace('prompt-', '').replace('.md', '')
    
    # 获取原始数据
    if tweet_id not in tweet_map:
        print(f"❌ 找不到原始数据: {tweet_id}")
        continue
    
    original = tweet_map[tweet_id]
    all_text = original.get('allText', '')
    
    # 提取 ARTICLE 0 的内容
    article_match = re.search(r'===ARTICLE 0===\s*(.*?)(?====ARTICLE|$)', all_text, re.DOTALL)
    if not article_match:
        print(f"❌ 无法提取 ARTICLE 0: {fname}")
        continue
    
    article_0 = article_match.group(1).strip()
    
    # 提取干净的 prompt
    clean_prompt = extract_clean_prompt(article_0)
    
    if not clean_prompt or len(clean_prompt) < 50:
        # 也检查 imgs 的 alt
        imgs = original.get('imgs', [])
        alt_prompts = [img.get('alt', '') for img in imgs if len(img.get('alt', '')) > 100]
        if alt_prompts:
            clean_prompt = alt_prompts[0]
            print(f"✅ {fname}: 从图片 ALT 提取 prompt ({len(clean_prompt)} 字符)")
        else:
            print(f"⚠️ {fname}: 无法提取有效 prompt，跳过")
            skipped.append(fname)
            continue
    
    # 读取当前 markdown
    content = fpath.read_text(encoding='utf-8')
    
    # 替换 ## Prompt 部分
    new_prompt_section = f"## Prompt\n\n{clean_prompt}\n"
    
    # 匹配 ## Prompt 到下一个 ## 之间的内容
    new_content = re.sub(
        r'## Prompt\s*\n.*?(?=\n## |\Z)',
        new_prompt_section,
        content,
        flags=re.DOTALL
    )
    
    if new_content != content:
        fpath.write_text(new_content, encoding='utf-8')
        fixed_count += 1
        print(f"✅ 修复: {fname} (prompt {len(clean_prompt)} 字符)")
    else:
        print(f"⚠️ {fname}: 替换失败")

print(f"\n**修复完成**: {fixed_count} 个文件")
if skipped:
    print(f"**跳过**: {len(skipped)} 个文件（无有效 prompt）")
    for s in skipped:
        print(f"  - {s}")
