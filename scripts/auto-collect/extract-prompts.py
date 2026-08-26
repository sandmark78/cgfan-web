#!/usr/bin/env python3
"""
从 preprocessed.json 提取干净的 prompt，输出到 extracted_prompts.json
这样 LLM 只需要评分和写 markdown，不需要自己提取 prompt

提取策略（按优先级）：
1. 图片 ALT（>50字符）
2. ARTICLE 0 中的 "提示词Prompt：" / "prompt：" 标记
3. Midjourney 参数（--ar, --v, --sref）
4. 英文 prompt 特征（Create, Generate, A hyper-realistic...）
5. 中文 prompt 特征（请将我上传, 整体采用...）
6. ARTICLE 1+（评论区）中的 prompt
"""
import json
import re
import sys
from pathlib import Path

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
sys.path.insert(0, str(WORKDIR / "scripts/auto-collect"))
from config import PREPROCESSED

OUTPUT = WORKDIR / "data/auto-collect/extracted_prompts.json"

def clean_noise(text):
    """删除推文杂文"""
    lines = text.split('\n')
    clean = []
    for line in lines:
        stripped = line.strip()
        # 跳过空行
        if not stripped:
            continue
        # 跳过作者名（纯文字+空格，<30字符，不含特殊符号）
        if re.match(r'^[A-Za-z\u4e00-\u9fff\s·\-]+$', stripped) and len(stripped) < 30:
            continue
        # 跳过 @handle
        if stripped.startswith('@'):
            continue
        # 跳过时间戳
        if re.match(r'^\d+:\d+\s*(AM|PM)\s*·', stripped):
            continue
        if re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+', stripped):
            continue
        if re.match(r'^\d+[dhm]\s*$', stripped):
            continue
        # 跳过互动数据
        if re.match(r'^[\d,.]+[KMB]?\s*$', stripped):
            continue
        if 'Views' in stripped:
            continue
        # 跳过 "Made with AI"
        if 'Made with' in stripped:
            continue
        # 跳过 "Prompt below"
        if 'Prompt below' in stripped:
            continue
        # 跳过 ===ARTICLE===
        if '===ARTICLE' in stripped:
            continue
        # 跳过 "Show more"
        if stripped == 'Show more':
            continue
        # 跳过纯表情
        if re.match(r'^[\U0001F300-\U0001F9FF\s]+$', stripped):
            continue
        
        clean.append(line)
    
    return '\n'.join(clean).strip()

def extract_prompt(item):
    """从一条推文数据中提取 prompt"""
    alltext = item.get('allText', '')
    imgs = item.get('imgs', [])
    
    # 策略1: 图片 ALT（最可靠）
    for img in imgs:
        alt = img.get('alt', '')
        if len(alt) > 50:
            return clean_noise(alt), "图片ALT"
    
    # 提取 ARTICLE 0
    article_0_match = re.search(r'===ARTICLE 0===\s*(.*?)(?====ARTICLE|$)', alltext, re.DOTALL)
    article_0 = article_0_match.group(1).strip() if article_0_match else alltext
    
    # 策略2: "提示词Prompt：" / "prompt：" 标记
    prompt_match = re.search(
        r'(?:提示词Prompt|prompt)[：:]\s*\n?(.*?)(?=\n\s*(?:提示词Prompt|prompt)[：:]|\Z)',
        article_0, re.DOTALL | re.IGNORECASE
    )
    if prompt_match:
        content = prompt_match.group(1).strip()
        if len(content) > 50:
            return clean_noise(content), "提示词标记"
    
    # 策略3: Midjourney 参数
    if '--ar' in article_0 or '--v' in article_0 or '--sref' in article_0:
        # 提取包含参数的段落
        lines = article_0.split('\n')
        prompt_lines = []
        for line in lines:
            if '--ar' in line or '--v' in line or '--sref' in line or '--stylize' in line:
                prompt_lines.append(line)
        if prompt_lines:
            return '\n'.join(prompt_lines).strip(), "Midjourney参数"
    
    # 策略4: 英文 prompt 特征
    create_match = re.search(
        r'((?:Create|A |The |Generate|Make|Build|Design|Render)[^\n]*\n(?:[^\n]+\n){2,})',
        article_0
    )
    if create_match and len(create_match.group(1)) > 100:
        return clean_noise(create_match.group(1)), "英文特征"
    
    # 策略5: 中文 prompt 特征
    cn_patterns = [
        r'(请将我上传[^\n]*\n(?:[^\n]+\n)*)',
        r'(整体采用[^\n]*\n(?:[^\n]+\n)*)',
    ]
    for pattern in cn_patterns:
        cn_match = re.search(pattern, article_0)
        if cn_match and len(cn_match.group(1)) > 100:
            return clean_noise(cn_match.group(1)), "中文特征"
    
    # 策略6: 检查 ARTICLE 1+（评论区）
    for i in range(1, 10):
        article_n_match = re.search(rf'===ARTICLE {i}===\s*(.*?)(?====ARTICLE|$)', alltext, re.DOTALL)
        if not article_n_match:
            break
        article_n = article_n_match.group(1).strip()
        
        # 检查是否包含 prompt 特征
        if any(marker in article_n for marker in ['提示词Prompt', 'prompt：', '--ar', '--v', 'Create', '请将我上传']):
            # 复用上面的提取逻辑
            prompt_match = re.search(
                r'(?:提示词Prompt|prompt)[：:]\s*\n?(.*?)(?=\n\s*(?:提示词Prompt|prompt)[：:]|\Z)',
                article_n, re.DOTALL | re.IGNORECASE
            )
            if prompt_match and len(prompt_match.group(1).strip()) > 50:
                return clean_noise(prompt_match.group(1)), f"ARTICLE {i}评论区"
            
            if '--ar' in article_n or '--v' in article_n:
                lines = [l for l in article_n.split('\n') if '--ar' in l or '--v' in l or '--sref' in l]
                if lines:
                    return '\n'.join(lines).strip(), f"ARTICLE {i}MJ参数"
            
            create_match = re.search(r'((?:Create|A |The )[^\n]*\n(?:[^\n]+\n){2,})', article_n)
            if create_match and len(create_match.group(1)) > 100:
                return clean_noise(create_match.group(1)), f"ARTICLE {i}英文"
    
    return None, "无有效prompt"

def main():
    print(f"📥 读取: {PREPROCESSED}")
    
    if not PREPROCESSED.exists():
        print(f"❌ 文件不存在: {PREPROCESSED}")
        sys.exit(1)
    
    with open(PREPROCESSED, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📦 共 {len(data)} 条预处理数据\n")
    
    results = []
    extracted = 0
    skipped = 0
    
    for item in data:
        tweet_id = item.get('tweet_id', '')
        author = item.get('author', '?')
        
        prompt, method = extract_prompt(item)
        
        if prompt and len(prompt) > 50:
            extracted += 1
            results.append({
                **item,
                'extracted_prompt': prompt,
                'extract_method': method,
                'prompt_length': len(prompt)
            })
            print(f"  ✅ {author} ({tweet_id}): {method} ({len(prompt)}字符)")
        else:
            skipped += 1
            print(f"  ❌ {author} ({tweet_id}): {method}")
    
    # 保存结果
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"📊 提取结果: {extracted} 条成功, {skipped} 条跳过")
    print(f"💾 保存到: {OUTPUT}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
