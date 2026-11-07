#!/usr/bin/env python3
"""
CGfan自动采集LLM处理脚本 v2
改进版本：更好的prompt提取和清理
"""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime

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

def extract_clean_prompt(tweet):
    """提取干净的prompt - 接受明确的prompt标记或详细的艺术描述"""
    # 优先级：1. imgs[].alt  2. allText中的Prompt标记  3. 详细艺术描述  4. quoteTweet
    
    # 1. 检查imgs[].alt - 必须有实质性内容
    for img in tweet.get('imgs', []):
        alt = img.get('alt', '')
        if alt and len(alt) > 150:
            # 检查是否包含prompt特征词
            prompt_indicators = ['prompt', '提示词', 'create', 'generate', '风格', '构图', '色彩', '光线']
            if any(indicator in alt.lower() for indicator in prompt_indicators):
                cleaned = clean_prompt_text(alt, tweet['author'])
                if len(cleaned) > 150:
                    return cleaned
    
    # 2. 从allText提取 - 接受明确的prompt标记
    all_text = tweet.get('allText', '')
    if all_text:
        # 查找明确的prompt标记
        prompt_markers = ['Prompt:', 'prompt:', '提示词:', '提示词见', 'Prompt ↓', '提示词↓', 'prompt：', '提示词：']
        for marker in prompt_markers:
            if marker in all_text:
                idx = all_text.find(marker)
                prompt_text = all_text[idx + len(marker):]
                cleaned = clean_prompt_text(prompt_text, tweet['author'])
                if len(cleaned) > 150:
                    return cleaned
        
        # 检查是否是详细的艺术描述（以描述性内容为主）
        # 排除明显的新闻、讨论、抱怨类内容
        news_indicators = ['封号', '被封', '账号', '安全事件', '黑客', '算法更新', '权重', '点击', '运营']
        has_news = any(indicator in all_text for indicator in news_indicators)
        
        # 检查是否有详细的艺术/技术描述
        art_indicators = ['主体：', '发型：', '妆容', '服装：', '场景：', '光线：', '风格：', '构图', '色彩', '材质', '光影']
        art_count = sum(1 for indicator in art_indicators if indicator in all_text)
        
        if not has_news and art_count >= 3:
            cleaned = clean_prompt_text(all_text, tweet['author'])
            if len(cleaned) > 200:
                return cleaned
    
    # 3. 从quoteTweet提取
    quote = tweet.get('quoteTweet')
    if quote:
        quote_text = quote.get('text', '')
        if quote_text:
            # 检查是否有prompt标记
            prompt_markers = ['Prompt:', 'prompt:', '提示词:', '提示词见', 'prompt：', '提示词：']
            for marker in prompt_markers:
                if marker in quote_text:
                    idx = quote_text.find(marker)
                    prompt_text = quote_text[idx + len(marker):]
                    cleaned = clean_prompt_text(prompt_text, tweet['author'])
                    if len(cleaned) > 150:
                        return cleaned
    
    return ""

def clean_prompt_text(text, author):
    """清理prompt文本，移除所有杂文"""
    lines = text.split('\n')
    cleaned_lines = []
    
    # 需要跳过的模式
    skip_patterns = [
        r'^\d{1,2}:\d{2}\s*(AM|PM)',  # 时间戳
        r'^\d+\s*Views?',  # Views
        r'^@[\w]+',  # @handle
        r'^Show translation',  # 翻译提示
        r'^Made with AI',  # Made with AI
        r'^·$',  # 单独的·
        r'^\d+$',  # 纯数字
        r'^[\d,]+$',  # 带逗号的数字
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # 检查是否匹配跳过模式
        skip = False
        for pattern in skip_patterns:
            if re.match(pattern, line):
                skip = True
                break
        
        if skip:
            continue
        
        # 跳过作者名
        if author and line == author:
            continue
        
        # 跳过包含时间戳的行
        if re.search(r'\d{1,2}:\d{2}\s*(AM|PM)\s*·', line):
            continue
        
        cleaned_lines.append(line)
    
    result = '\n'.join(cleaned_lines).strip()
    
    # 移除开头的作者名
    if author and result.startswith(author):
        result = result[len(author):].lstrip()
    
    return result

def should_filter_content(text, tweet):
    """判断是否应该过滤"""
    if not text or len(text.strip()) < 50:
        return True, "无有效prompt"
    
    text_lower = text.lower()
    
    # 检查视频
    if any('video' in url.lower() for url in tweet.get('image_urls', [])):
        return True, "视频内容"
    
    # 检查人像写真（但要保留古风）
    portrait_keywords = [
        'portrait of a beautiful', 'portrait of a young woman',
        'hyper-realistic fashion photograph', 'cinematic portrait',
        'beauty editorial portrait', 'fashion editorial'
    ]
    
    is_portrait = any(kw in text_lower for kw in portrait_keywords)
    is_ancient = any(kw in text_lower for kw in ['古风', '汉服', 'hanfu', 'ancient chinese', '东方'])
    
    if is_portrait and not is_ancient:
        return True, "人像写真"
    
    # 检查性暗示
    suggestive = [
        'lingerie', 'underwear', 'bikini', 'swimsuit',
        'sheer', 'transparent', 'see-through', '透视'
    ]
    if any(kw in text_lower for kw in suggestive):
        return True, "隐晦性暗示"
    
    return False, ""

def score_content(tweet, prompt):
    """8维度评分"""
    prompt_lower = prompt.lower()
    
    # 基础评分
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
    
    # 根据内容调整
    if any(kw in prompt_lower for kw in ['东方', 'oriental', '古风', '水墨', 'chinese']):
        base_scores['aesthetic'] = 8
        base_scores['composition'] = 8
    
    if any(kw in prompt_lower for kw in ['3d', 'render', 'cgi', 'octane']):
        base_scores['technical'] = 8
        base_scores['detail'] = 8
    
    if any(kw in prompt_lower for kw in ['photography', 'cinematic', 'film', '摄影']):
        base_scores['lighting'] = 8
        base_scores['aesthetic'] = 8
    
    if any(kw in prompt_lower for kw in ['design', 'typography', 'editorial', '海报']):
        base_scores['composition'] = 8
        base_scores['curation'] = 8
    
    if any(kw in prompt_lower for kw in ['miniature', 'paper cut', '微缩', '纸艺']):
        base_scores['creativity'] = 8
        base_scores['detail'] = 8
    
    if any(kw in prompt_lower for kw in ['retro', 'vintage', 'film', '复古', '胶片']):
        base_scores['color'] = 8
        base_scores['aesthetic'] = 8
    
    # 应用品味调整
    adjustment = calculate_taste_adjustment(prompt, [])
    final_scores = apply_adjustment(base_scores, adjustment)
    
    # 确保至少1个维度≤7
    min_val = min(final_scores.values())
    if min_val >= 8:
        for dim in final_scores:
            if final_scores[dim] == min_val:
                final_scores[dim] = 7
                break
    
    total = sum(final_scores.values())
    return final_scores, total

def generate_markdown_file(tweet, prompt, scores, total_score):
    """生成markdown文件"""
    tweet_id = tweet['tweet_id']
    author = tweet['author']
    author_link = tweet['authorLink']
    source = tweet['source']
    image_urls = tweet.get('image_urls', [])
    
    slug = f"prompt-{tweet_id}"
    
    # 生成标题
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
    for i in range(min(4, len(image_urls))):
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
    escaped_prompt = prompt.replace('"', '\\"').replace('\n', '\\n')
    
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
        
        print(f"[{i}/{total_count}] {author} ({tweet_id})")
        
        # 提取prompt
        prompt = extract_clean_prompt(tweet)
        
        # 过滤检查
        needs_filter, reason = should_filter_content(prompt, tweet)
        
        if needs_filter:
            filtered_count += 1
            filtered_reasons[reason] = filtered_reasons.get(reason, 0) + 1
            print(f"  ❌ 过滤: {reason}")
            continue
        
        # 评分
        scores, total_score = score_content(tweet, prompt)
        
        # 检查分数门槛
        if total_score < 55:
            filtered_count += 1
            filtered_reasons["分数<55"] = filtered_reasons.get("分数<55", 0) + 1
            print(f"  ❌ 过滤: 总分{total_score}<55")
            continue
        
        # 生成markdown
        slug = f"prompt-{tweet_id}"
        markdown = generate_markdown_file(tweet, prompt, scores, total_score)
        
        # 保存markdown
        md_path = OUTPUT_DIR / f"{slug}.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        # 记录
        included_count += 1
        included_items.append({
            'tweet_id': tweet_id,
            'author': author,
            'score': total_score,
            'scores': scores,
            'markdown': str(md_path),
            'image_urls': tweet.get('image_urls', [])[:4]
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
    
    print("\n生成的Markdown文件:")
    for item in included_items:
        print(f"  - {item['markdown']}")
    
    # 保存待下载图片列表
    download_list_path = WORKSPACE / 'data/auto-collect/images_to_download.json'
    with open(download_list_path, 'w') as f:
        json.dump([{'slug': f"prompt-{item['tweet_id']}", 'urls': item['image_urls']} for item in included_items], f, indent=2)
    
    print(f"\n待下载图片列表已保存: {download_list_path}")
    print("\n处理完成！")

if __name__ == '__main__':
    main()
