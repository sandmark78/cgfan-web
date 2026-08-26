#!/usr/bin/env python3
"""
修复剩余的3个文件：
1. 从 ARTICLE 1 提取 Michael Rabone 的 prompt
2. 删除 Larus Canus 和 古一 的无 prompt 文件
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

tweet_map = {item['id']: item for item in tweets}

# 1. 修复 Michael Rabone (从 ARTICLE 1 提取)
print("1. 修复 Michael Rabone 的 prompt...")
tweet_id = '2092250667192668482'
fpath = CONTENT_DIR / f'prompt-{tweet_id}.md'

if tweet_id in tweet_map and fpath.exists():
    item = tweet_map[tweet_id]
    all_text = item.get('allText', '')
    
    # 提取 ARTICLE 1
    article_match = re.search(r'===ARTICLE 1===\s*(.*?)(?====ARTICLE|$)', all_text, re.DOTALL)
    if article_match:
        article_1 = article_match.group(1).strip()
        
        # 清理：删除作者名、时间戳、互动数据
        lines = article_1.split('\n')
        clean_lines = []
        for line in lines:
            line = line.strip()
            # 跳过作者名和 @handle
            if line.startswith('Michael Rabone') or line.startswith('@'):
                continue
            # 跳过时间戳
            if re.match(r'^\d+h$', line):
                continue
            # 跳过纯数字
            if re.match(r'^\d+$', line):
                continue
            if line:
                clean_lines.append(line)
        
        clean_prompt = '\n'.join(clean_lines)
        
        # 读取 markdown
        content = fpath.read_text(encoding='utf-8')
        
        # 替换 ## Prompt 部分
        new_content = re.sub(
            r'## Prompt\s*\n.*?(?=\n## |\Z)',
            f'## Prompt\n\n{clean_prompt}\n',
            content,
            flags=re.DOTALL
        )
        
        fpath.write_text(new_content, encoding='utf-8')
        print(f"   ✅ 已修复 prompt-{tweet_id}.md ({len(clean_prompt)} 字符)")

# 2. 删除无 prompt 的文件
print("\n2. 删除无 prompt 的文件...")
delete_ids = ['2091556282754842675', '2092209714037928401']

for tweet_id in delete_ids:
    fpath = CONTENT_DIR / f'prompt-{tweet_id}.md'
    if fpath.exists():
        fpath.unlink()
        print(f"   ✅ 已删除 prompt-{tweet_id}.md")

print("\n完成！")
