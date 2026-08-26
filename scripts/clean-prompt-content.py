#!/usr/bin/env python3
"""
清理今日采集的 prompt 内容
删除：作者名、@handle、时间戳、互动数据、"Made with AI"、===ARTICLE===、评论区
保留：实际的 prompt 内容
"""
import re
from pathlib import Path

CONTENT_DIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts/2026/08/26")

def clean_prompt(text):
    """清理 prompt 内容"""
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # 跳过空行
        if not line.strip():
            continue
        
        # 跳过作者名和 @handle
        if re.match(r'^[A-Z][a-zA-Z\s]+$', line.strip()) and len(line.strip()) < 30:
            continue
        if line.strip().startswith('@'):
            continue
        
        # 跳过时间戳
        if re.match(r'^\d+[dhm]\s*$', line.strip()):
            continue
        if re.match(r'^\d+:\d+\s*(AM|PM)\s*·', line.strip()):
            continue
        if re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+', line.strip()):
            continue
        
        # 跳过互动数据
        if re.match(r'^[\d,.]+[KMB]?\s*$', line.strip()):
            continue
        if 'Views' in line or 'Likes' in line:
            continue
        
        # 跳过 "Made with AI" 等
        if 'Made with' in line or 'Prompt below' in line:
            continue
        
        # 跳过 ===ARTICLE N===
        if '===ARTICLE' in line:
            continue
        
        # 跳过推文正文特征（非 prompt 内容）
        # prompt 通常包含：参数（--ar, --v）、描述性语言、技术术语
        # 推文正文通常包含：表情符号、互动语言、个人感想
        
        # 保留这一行
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

fixed_count = 0

for md_file in CONTENT_DIR.glob("prompt-*.md"):
    content = md_file.read_text(encoding='utf-8')
    
    # 提取 ## Prompt 部分
    prompt_match = re.search(r'## Prompt\s*\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if not prompt_match:
        continue
    
    original_prompt = prompt_match.group(1).strip()
    
    # 检查是否有杂文
    has_noise = any([
        'Made with' in original_prompt,
        'Prompt below' in original_prompt,
        '===ARTICLE' in original_prompt,
        '@' in original_prompt and len(re.findall(r'@\w+', original_prompt)) > 0,
        'Views' in original_prompt,
        '🤯' in original_prompt or '👇' in original_prompt,
    ])
    
    if not has_noise:
        continue
    
    # 清理 prompt
    cleaned_prompt = clean_prompt(original_prompt)
    
    # 如果清理后太短，说明可能都是杂文，跳过
    if len(cleaned_prompt) < 100:
        print(f"⚠️ {md_file.name}: 清理后太短，跳过")
        continue
    
    # 替换原文
    new_content = content.replace(original_prompt, cleaned_prompt)
    md_file.write_text(new_content, encoding='utf-8')
    fixed_count += 1
    print(f"✅ 修复: {md_file.name}")

print(f"\n**修复完成**: {fixed_count} 个文件")
