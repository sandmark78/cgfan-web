#!/usr/bin/env python3
"""
预处理脚本 v2.2：过滤/去重 + prompt提取

脚本负责：
- 过滤视频内容
- 去重检查（基于 source URL）
- 提取基本信息（author, date, image URLs）
- 提取 prompt（从 allText）
- 输出完整数据供 LLM 处理

LLM 负责：
- 判断内容类型（人像写真/产品/插画等）
- 过滤不合格内容
- 标题生成、标签提取、评分

图片下载：
- LLM 评分后，只对≥55分的条目下载图片
- 避免下载大量最终被丢弃的图片
"""

import json
import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import TWEETS_BATCH, PREPROCESSED, IMAGES_DIR

# 兼容旧路径
import shutil
TMP_TWEETS = Path('/tmp/tweets_batch.json')
if not TWEETS_BATCH.exists() and TMP_TWEETS.exists():
    shutil.copy(TMP_TWEETS, TWEETS_BATCH)

def extract_prompt(all_text: str) -> str:
    """从 allText 中提取 prompt"""
    prompt = ''
    
    # 方法1: 查找明确的 prompt 标记
    patterns = [
        r'Prompt[:：]\s*\n*([\s\S]+?)(?=\n\nMade with AI|\n\n\d+:\d+ [AP]M|\n\d+:\d+ AM ·|\n\d+:\d+ PM ·|\Z)', 
        r'提示词[:：]\s*\n*([\s\S]+?)(?=\n\nMade with AI|\n\n\d+:\d+ [AP]M|\n\d+:\d+ AM ·|\n\d+:\d+ PM ·|\Z)',
        r'咒语[:：]\s*\n*([\s\S]+?)(?=\n\nMade with AI|\n\n\d+:\d+ [AP]M|\Z)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, all_text, re.IGNORECASE)
        if match:
            prompt = match.group(1).strip()
            break
    
    # 方法2: 从 ARTICLE 0 提取完整描述
    if not prompt:
        articles = re.findall(r'===ARTICLE 0===\n(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
        if articles:
            content = articles[0]
            lines = content.split('\n')
            prompt_lines = []
            skip_author = True
            
            for line in lines:
                # 跳过作者信息和日期行
                if skip_author and (line.startswith('@') or line.strip() == '' or 
                                   'Made with AI' in line or ('·' in line and 'Views' in line)):
                    continue
                if 'Views' in line or line.strip().isdigit():
                    continue
                skip_author = False
                
                # 只保留有意义的长行
                if len(line) > 30:
                    prompt_lines.append(line)
            
            if prompt_lines:
                prompt = '\n'.join(prompt_lines[:20])
    
    return prompt[:3000] if prompt else ''

def is_duplicate(tweet_id: str) -> bool:
    """检查推文是否已收录"""
    source_url = f"https://x.com/i/status/{tweet_id}"
    
    # 检查 markdown 文件
    prompts_dir = Path('content/prompts')
    if prompts_dir.exists():
        for md_file in prompts_dir.rglob('*.md'):
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                if source_url in content or f"prompt-{tweet_id}" in content:
                    return True
            except Exception:
                pass
    return False

def main():
    print(f"📥 读取推文数据: {TWEETS_BATCH}")
    
    if not Path(TWEETS_BATCH).exists():
        print(f"❌ 文件不存在: {TWEETS_BATCH}")
        sys.exit(1)
    
    with open(TWEETS_BATCH, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    
    print(f"📦 读取到 {len(tweets)} 条推文\n")
    
    # 逐条处理
    preprocessed = []
    skipped_video = 0
    skipped_duplicate = 0
    prompt_extracted = 0
    
    for tweet in tweets:
        tweet_id = tweet['id']
        
        # 视频过滤
        if tweet.get('has_video'):
            print(f"🎬 跳过视频: {tweet_id}")
            skipped_video += 1
            continue
        
        # 去重检查
        if is_duplicate(tweet_id):
            print(f"⏭️ 跳过重复: {tweet_id}")
            skipped_duplicate += 1
            continue
        
        # 提取基本信息
        author = tweet.get('author', 'Unknown')
        author_link = tweet.get('authorLink', '')
        date = tweet.get('date', '')
        all_text = tweet.get('allText', '')
        imgs = tweet.get('imgs', [])
        
        # 检查是否有图片
        if not imgs:
            print(f"⚠️ 无图片: {tweet_id}")
            continue
        
        # 提取图片 URL
        image_urls = []
        for i, img in enumerate(imgs[:4]):  # 最多4张
            img_url = img.get('src', '')
            if img_url:
                image_urls.append(img_url)
        
        if not image_urls:
            print(f"⚠️ 无图片URL: {tweet_id}")
            continue
        
        # 提取 prompt
        prompt = extract_prompt(all_text)
        if prompt:
            prompt_extracted += 1
        
        # 保存完整数据
        preprocessed.append({
            'tweet_id': tweet_id,
            'author': author,
            'authorLink': author_link,
            'date': date,
            'allText': all_text,
            'prompt': prompt,  # 已提取的 prompt
            'imgs': imgs,
            'image_urls': image_urls,
            'source': f"https://x.com/i/status/{tweet_id}"
        })
        
        prompt_status = f"prompt: {len(prompt)}字" if prompt else "无prompt"
        print(f"✅ 预处理: {tweet_id} ({len(image_urls)} 张图片, {prompt_status})\n")
    
    print(f"\n{'='*60}")
    print(f"📊 预处理完成")
    print(f"  总计: {len(tweets)} 条")
    print(f"  视频: {skipped_video} 条")
    print(f"  重复: {skipped_duplicate} 条")
    print(f"  通过: {len(preprocessed)} 条")
    print(f"  Prompt提取: {prompt_extracted}/{len(preprocessed)} 条")
    
    # 保存供 LLM 处理
    if preprocessed:
        output_file = PREPROCESSED
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(preprocessed, f, ensure_ascii=False, indent=2)
        print(f"\n💾 数据已保存: {output_file}")
        print(f"🤖 请在下一轮用 LLM 处理这些数据（评分、生成 markdown）")
    else:
        print("\n⚠️ 无有效数据")

if __name__ == "__main__":
    main()
