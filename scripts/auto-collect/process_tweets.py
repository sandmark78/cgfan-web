#!/usr/bin/env python3
"""
CGfan自动采集LLM处理脚本
处理preprocessed.json，过滤、评分、生成markdown文件
"""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime
import requests

# 添加脚本路径
sys.path.insert(0, str(Path(__file__).parent.parent))
from taste_bonus import calculate_taste_adjustment, apply_adjustment

# 配置
WORKSPACE = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')
PREPROCESSED = WORKSPACE / 'data/auto-collect/preprocessed.json'
OUTPUT_DIR = WORKSPACE / 'content/prompts/2026/11/08'
IMAGES_DIR = WORKSPACE / 'public/images/prompts'

# 确保目录存在
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

def clean_prompt(text, author, tweet_id):
    """清理prompt，移除杂文"""
    if not text:
        return ""
    
    # 移除作者名、@handle、时间戳、Views、Made with AI
    lines = text.split('\n')
    cleaned = []
    skip_patterns = [
        r'^\d+:\d+\s*(AM|PM)\s*·\s*\w+\s*\d+',  # 时间戳
        r'^\d+\s*Views',  # Views
        r'^Made with AI',  # Made with AI
        r'^@\w+',  # @handle
        r'^Show translation',  # 翻译提示
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # 跳过杂文
        skip = False
        for pattern in skip_patterns:
            if re.match(pattern, line):
                skip = True
                break
        if skip:
            continue
        # 跳过纯数字行（点赞/转发数）
        if re.match(r'^\d+$', line):
            continue
        cleaned.append(line)
    
    result = '\n'.join(cleaned)
    
    # 移除开头的作者名（通常是第一行）
    if author and result.startswith(author):
        result = result[len(author):].lstrip()
    
    return result.strip()

def should_filter(text, has_prompt, is_video):
    """判断是否应该过滤"""
    text_lower = text.lower()
    
    # 过滤视频内容
    if is_video:
        return True, "视频内容"
    
    # 过滤无有效prompt
    if not has_prompt or len(text.strip()) < 50:
        return True, "无有效prompt"
    
    # 过滤私房写真、人像写真（含仙侠/古风/电影感人像）
    portrait_keywords = [
        '私房', '写真', '人像', 'selfie', 'portrait of a beautiful',
        'portrait of a young woman', 'portrait of a woman',
        'hyper-realistic fashion photograph', 'cinematic portrait',
        'beauty editorial', 'fashion editorial'
    ]
    
    # 检查是否是人像写真
    is_portrait = any(kw in text_lower for kw in portrait_keywords)
    
    # 但保留古风写真、油纸伞写真
    ancient_style = any(kw in text_lower for kw in ['古风', '汉服', '油纸伞', 'hanfu', 'ancient chinese'])
    
    if is_portrait and not ancient_style:
        return True, "人像写真"
    
    # 过滤隐晦性暗示
    suggestive_keywords = [
        '撩衣', '露肩带', '透视装', '咬唇', '跪姿',
        'lingerie', 'underwear', 'bikini', 'swimsuit',
        'sheer', 'transparent', 'see-through'
    ]
    if any(kw in text_lower for kw in suggestive_keywords):
        return True, "隐晦性暗示"
    
    return False, ""

def extract_prompt_from_tweet(tweet):
    """从推文中提取干净的prompt"""
    all_text = tweet.get('allText', '')
    imgs = tweet.get('imgs', [])
    quote_tweet = tweet.get('quoteTweet')
    
    # 优先从imgs[].alt提取
    for img in imgs:
        alt = img.get('alt', '')
        if alt and len(alt) > 100:  # 有效的prompt通常较长
            return clean_prompt(alt, tweet['author'], tweet['tweet_id'])
    
    # 其次从allText提取
    if all_text:
        # 查找prompt标记
        prompt_markers = ['Prompt:', 'prompt:', '提示词', 'Prompt ↓', '提示词见']
        for marker in prompt_markers:
            if marker in all_text:
                # 提取marker后的内容
                idx = all_text.find(marker)
                prompt_text = all_text[idx + len(marker):]
                cleaned = clean_prompt(prompt_text, tweet['author'], tweet['tweet_id'])
                if len(cleaned) > 100:
                    return cleaned
        
        # 如果没有明确标记，使用整个allText
        cleaned = clean_prompt(all_text, tweet['author'], tweet['tweet_id'])
        if len(cleaned) > 100:
            return cleaned
    
    # 最后从quoteTweet提取
    if quote_tweet:
        quote_text = quote_tweet.get('text', '')
        if quote_text:
            cleaned = clean_prompt(quote_text, tweet['author'], tweet['tweet_id'])
            if len(cleaned) > 100:
                return cleaned
    
    return ""

def score_tweet(tweet, prompt):
    """8维度评分"""
    prompt_lower = prompt.lower()
    
    # 基础评分（5-8分）
    base_scores = {
        'composition': 7,
        'color': 7,
        'lighting': 7,
        'detail': 7,
        'creativity': 7,
        'technical': 7,
        'aesthetic': 7,
        'curation': 7
    }
    
    # 根据内容调整评分
    # 东方美学
    if any(kw in prompt_lower for kw in ['东方', 'oriental', '古风', '水墨', 'chinese']):
        base_scores['aesthetic'] = 8
        base_scores['composition'] = 8
    
    # 3D/渲染
    if any(kw in prompt_lower for kw in ['3d', 'render', 'cgi', 'octane']):
        base_scores['technical'] = 8
        base_scores['detail'] = 8
    
    # 摄影/电影感
    if any(kw in prompt_lower for kw in ['photography', 'cinematic', 'film', '摄影']):
        base_scores['lighting'] = 8
        base_scores['aesthetic'] = 8
    
    # 设计/排版
    if any(kw in prompt_lower for kw in ['design', 'typography', 'editorial', '海报']):
        base_scores['composition'] = 8
        base_scores['curation'] = 8
    
    # 微缩/纸艺
    if any(kw in prompt_lower for kw in ['miniature', 'paper cut', '微缩', '纸艺']):
        base_scores['creativity'] = 8
        base_scores['detail'] = 8
    
    # 复古/胶片
    if any(kw in prompt_lower for kw in ['retro', 'vintage', 'film', '复古', '胶片']):
        base_scores['color'] = 8
        base_scores['aesthetic'] = 8
    
    # 应用品味调整
    tags = []
    adjustment = calculate_taste_adjustment(prompt, tags)
    final_scores = apply_adjustment(base_scores, adjustment)
    
    # 确保至少1个维度≤7（禁止所有维度≥8）
    min_val = min(final_scores.values())
    if min_val >= 8:
        # 找到第一个等于min_val的维度并降为7
        for dim in final_scores:
            if final_scores[dim] == min_val:
                final_scores[dim] = 7
                break
    
    # 计算总分
    total = sum(final_scores.values())
    
    return final_scores, total

def generate_markdown(tweet, prompt, scores, total_score):
    """生成markdown文件"""
    tweet_id = tweet['tweet_id']
    author = tweet['author']
    author_link = tweet['authorLink']
    source = tweet['source']
    image_urls = tweet.get('image_urls', [])
    
    # 生成slug
    slug = f"prompt-{tweet_id}"
    
    # 生成标题（从prompt提取关键词）
    title_keywords = []
    prompt_lower = prompt.lower()
    if '东方' in prompt_lower or 'chinese' in prompt_lower:
        title_keywords.append('东方美学')
    if '3d' in prompt_lower or 'render' in prompt_lower:
        title_keywords.append('3D渲染')
    if '摄影' in prompt_lower or 'photography' in prompt_lower:
        title_keywords.append('摄影')
    if '设计' in prompt_lower or 'design' in prompt_lower:
        title_keywords.append('设计')
    if '微缩' in prompt_lower or 'miniature' in prompt_lower:
        title_keywords.append('微缩')
    
    if not title_keywords:
        title_keywords.append('AI艺术')
    
    title = f"{' × '.join(title_keywords[:2])} - {author}"
    
    # 分类
    category = 'AI艺术'
    if '东方' in prompt_lower or 'chinese' in prompt_lower:
        category = '东方美学'
    elif '3d' in prompt_lower or 'render' in prompt_lower:
        category = '3D渲染'
    elif '摄影' in prompt_lower or 'photography' in prompt_lower:
        category = '摄影'
    elif '设计' in prompt_lower or 'design' in prompt_lower:
        category = '设计'
    
    # 标签
    tags = [category, author]
    if '东方' in prompt_lower:
        tags.append('东方')
    if '3d' in prompt_lower:
        tags.append('3D')
    
    # 模型
    model = '通用 Prompt'
    if 'gpt' in prompt_lower or 'chatgpt' in prompt_lower:
        model = 'GPT-Image2'
    elif 'midjourney' in prompt_lower:
        model = 'Midjourney'
    
    # 图片路径
    images = []
    for i, url in enumerate(image_urls[:4]):  # 最多4张
        if i == 0:
            images.append(f"/images/prompts/{slug}.jpg")
        else:
            images.append(f"/images/prompts/{slug}-{i+1}.jpg")
    
    cover = images[0] if images else ""
    
    # 日期
    now = datetime.now()
    added = now.strftime("%Y-%m-%dT%H:%M:%S.000+08:00")
    date = now.strftime("%Y-%m-%d")
    
    # 生成frontmatter
    escaped_prompt = prompt.replace('"', '\\"')
    frontmatter = f"""---
title: "{title}"
slug: "{slug}"
author: "{author}"
author_link: "{author_link}"
source: "{source}"
source_link: "{author_link}"
prompt: "{escaped_prompt}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "{model}"
images:
"""
    for img in images:
        frontmatter += f'  - "{img}"\n'
    
    frontmatter += f"""cover: "{cover}"
added: "{added}"
date: "{date}"
score: {total_score}
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
    
    return frontmatter

def download_images(tweet, slug):
    """下载图片"""
    image_urls = tweet.get('image_urls', [])
    downloaded = []
    
    for i, url in enumerate(image_urls[:4]):  # 最多4张
        if i == 0:
            filename = f"{slug}.jpg"
        else:
            filename = f"{slug}-{i+1}.jpg"
        
        filepath = IMAGES_DIR / filename
        
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                downloaded.append(str(filepath))
        except Exception as e:
            print(f"  下载失败 {url}: {e}")
    
    return downloaded

def main():
    # 加载数据
    with open(PREPROCESSED) as f:
        tweets = json.load(f)
    
    print(f"开始处理 {len(tweets)} 条推文...\n")
    
    # 统计
    total_count = len(tweets)
    filtered_count = 0
    included_count = 0
    filtered_reasons = {}
    included_items = []
    
    # 处理每条推文
    for i, tweet in enumerate(tweets, 1):
        tweet_id = tweet['tweet_id']
        author = tweet['author']
        
        print(f"[{i}/{total_count}] 处理 {author} ({tweet_id})...")
        
        # 提取prompt
        prompt = extract_prompt_from_tweet(tweet)
        
        # 检查是否有视频
        is_video = any('video' in url.lower() for url in tweet.get('image_urls', []))
        
        # 过滤检查
        needs_filter, reason = should_filter(prompt, len(prompt) > 50, is_video)
        
        if needs_filter:
            filtered_count += 1
            filtered_reasons[reason] = filtered_reasons.get(reason, 0) + 1
            print(f"  ❌ 过滤: {reason}")
            continue
        
        # 评分
        scores, total_score = score_tweet(tweet, prompt)
        
        # 检查分数门槛
        if total_score < 55:
            filtered_count += 1
            filtered_reasons["分数<55"] = filtered_reasons.get("分数<55", 0) + 1
            print(f"  ❌ 过滤: 总分{total_score}<55")
            continue
        
        # 生成markdown
        slug = f"prompt-{tweet_id}"
        markdown = generate_markdown(tweet, prompt, scores, total_score)
        
        # 保存markdown
        md_path = OUTPUT_DIR / f"{slug}.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # 下载图片
        downloaded = download_images(tweet, slug)
        
        # 记录
        included_count += 1
        included_items.append({
            'tweet_id': tweet_id,
            'author': author,
            'score': total_score,
            'scores': scores,
            'markdown': str(md_path),
            'images': downloaded
        })
        
        score_detail = '+'.join([str(scores[k]) for k in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']])
        print(f"  ✅ 收录: {score_detail}={total_score}")
    
    # 输出报告
    print("\n" + "="*60)
    print("处理报告")
    print("="*60)
    print(f"总数: {total_count}")
    print(f"过滤: {filtered_count}")
    print(f"收录: {included_count}")
    print("\n过滤原因:")
    for reason, count in sorted(filtered_reasons.items(), key=lambda x: -x[1]):
        print(f"  - {reason}: {count}")
    
    print("\n收录数据评分明细:")
    for item in sorted(included_items, key=lambda x: -x['score']):
        scores = item['scores']
        score_detail = '+'.join([str(scores[k]) for k in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']])
        print(f"  [{item['tweet_id']}] {item['author']}: {score_detail}={item['score']}")
        print(f"    Markdown: {item['markdown']}")
        print(f"    图片: {len(item['images'])}张")
    
    print("\n生成的Markdown文件:")
    for item in included_items:
        print(f"  - {item['markdown']}")
    
    print("\n处理完成！")

if __name__ == '__main__':
    main()
