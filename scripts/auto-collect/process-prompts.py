#!/usr/bin/env python3
"""
处理采集到的推文
- 提取prompt
- 8维度评分（构图/色彩/光影/细节/创意/技术/审美/策展）
- 60分以上保留
- 生成中文标题
- 创建markdown文件
- 运行Prompt DNA分析
- 提交部署
"""

import json
import subprocess
import sys
import re
from pathlib import Path
from datetime import datetime

def run(cmd, timeout=30):
    """执行命令"""
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip(), r.returncode

def load_tweets():
    """加载采集到的推文"""
    tweets_path = Path("/tmp/tweets_batch.json")
    if not tweets_path.exists():
        print("❌ 未找到采集数据")
        return []
    
    with open(tweets_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_prompt(text):
    """从推文中提取prompt"""
    # 查找prompt标记
    patterns = [
        r'(?:prompt|提示词)[：:]\s*([^\n]+(?:\n(?!(?:prompt|提示词)[：:]|@)[^\n]+)*)',
        r'```([\s\S]+?)```',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            return max(matches, key=lambda x: len(str(x)))
    
    return text[:500] if len(text) > 500 else text

def score_8_dimensions(prompt_text, images):
    """8维度评分（构图/色彩/光影/细节/创意/技术/审美/策展）"""
    text = prompt_text.lower()
    scores = {
        'composition': 6,  # 构图
        'color': 6,        # 色彩
        'lighting': 6,     # 光影
        'detail': 6,       # 细节
        'creativity': 6,   # 创意
        'technical': 6,    # 技术
        'aesthetic': 6,    # 审美
        'curation': 6      # 策展
    }
    
    # 构图评分
    composition_keywords = {
        'symmetry': 2, '对称': 2, 'rule of thirds': 2, '三分法': 2,
        'close-up': 1.5, '特写': 1.5, 'wide angle': 1.5, '广角': 1.5,
        'composition': 2, '构图': 2, 'framing': 1.5, 'balance': 1.5
    }
    for kw, points in composition_keywords.items():
        if kw in text:
            scores['composition'] += points
    
    # 色彩评分
    color_keywords = {
        'color palette': 2, '色彩': 2, 'muted': 1.5, '柔和': 1.5,
        'vibrant': 1.5, '鲜艳': 1.5, 'pastel': 1.5, '粉彩': 1.5,
        'monochrome': 1.5, '单色': 1.5, 'earth tones': 1.5, '大地色': 1.5
    }
    for kw, points in color_keywords.items():
        if kw in text:
            scores['color'] += points
    
    # 光影评分
    lighting_keywords = {
        'cinematic lighting': 2.5, '电影光': 2.5, 'dramatic light': 2.5, '戏剧光': 2.5,
        'soft light': 2, '柔光': 2, 'backlight': 2, '背光': 2,
        'volumetric': 2, '体积光': 2, 'natural light': 1.5, '自然光': 1.5
    }
    for kw, points in lighting_keywords.items():
        if kw in text:
            scores['lighting'] += points
    
    # 细节评分
    detail_keywords = {
        'detailed': 2, '细节': 2, 'intricate': 2, '精致': 2,
        'highly detailed': 2.5, 'highly detailed': 2.5, 'ultra detailed': 2.5,
        'texture': 1.5, '纹理': 1.5, 'realistic': 1.5, '真实': 1.5
    }
    for kw, points in detail_keywords.items():
        if kw in text:
            scores['detail'] += points
    
    # 创意评分
    creativity_keywords = {
        'surreal': 2.5, '超现实': 2.5, 'fantasy': 2, '奇幻': 2,
        'conceptual': 2, '概念': 2, 'unique': 2, '独特': 2,
        'innovative': 2, '创新': 2, 'artistic': 2, '艺术': 2
    }
    for kw, points in creativity_keywords.items():
        if kw in text:
            scores['creativity'] += points
    
    # 技术评分
    technical_keywords = {
        '8k': 2, '4k': 1.5, 'high quality': 2, '高质量': 2,
        'professional': 1.5, '专业': 1.5, 'masterpiece': 2.5, '杰作': 2.5,
        'photorealistic': 2.5, '照片级': 2.5, 'hyperrealistic': 2.5
    }
    for kw, points in technical_keywords.items():
        if kw in text:
            scores['technical'] += points
    
    # 审美评分
    aesthetic_keywords = {
        'elegant': 2, '优雅': 2, 'beautiful': 1.5, '美丽': 1.5,
        'aesthetic': 2, '美学': 2, 'stylish': 1.5, '时尚': 1.5,
        'moody': 1.5, '情绪': 1.5, 'atmospheric': 2, '氛围': 2
    }
    for kw, points in aesthetic_keywords.items():
        if kw in text:
            scores['aesthetic'] += points
    
    # 策展评分
    curation_keywords = {
        'editorial': 2.5, '编辑': 2.5, 'fashion': 2, '时尚': 2,
        'magazine': 2.5, '杂志': 2.5, 'professional': 1.5, '专业': 1.5,
        'campaign': 2, '广告': 2, 'commercial': 1.5, '商业': 1.5
    }
    for kw, points in curation_keywords.items():
        if kw in text:
            scores['curation'] += points
    
    # 图片加分
    if images:
        img_bonus = min(len(images) * 0.5, 2)
        for key in scores:
            scores[key] += img_bonus
    
    # 限制最高分10分
    for key in scores:
        scores[key] = min(scores[key], 10)
    
    # 计算总分（8维度平均）
    total = sum(scores.values()) / 8 * 8  # 转换为80分制
    
    return scores, total

def generate_title(prompt_text):
    """生成中文标题"""
    keywords = []
    
    style_words = {
        'cinematic': '电影感', 'vintage': '复古', 'retro': '怀旧',
        'minimalist': '极简', 'elegant': '优雅', 'dramatic': '戏剧性',
        'moody': '情绪化', 'futuristic': '未来', 'sci-fi': '科幻',
        'cyberpunk': '赛博朋克', 'oriental': '东方', 'chinese': '中国风',
        'japanese': '日式', 'anime': '动漫'
    }
    
    prompt_lower = prompt_text.lower()
    for eng, chn in style_words.items():
        if eng in prompt_lower:
            keywords.append(chn)
    
    subject_words = {
        'portrait': '人像', 'landscape': '风景', 'city': '城市',
        'architecture': '建筑', 'nature': '自然', 'character': '角色',
        'product': '产品', 'fashion': '时尚', 'food': '美食'
    }
    
    for eng, chn in subject_words.items():
        if eng in prompt_lower:
            keywords.append(chn)
            break
    
    if keywords:
        title = '与'.join(keywords[:2]) + '风格'
    else:
        title = '创意视觉'
    
    return title

def create_markdown(tweet, prompt, title, scores, total_score):
    """创建markdown文件"""
    tweet_id = tweet['id']
    author = tweet.get('author', 'Unknown')
    date = tweet.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    category = 'uncategorized'
    if any(kw in prompt.lower() for kw in ['portrait', 'person', 'character']):
        category = 'portrait'
    elif any(kw in prompt.lower() for kw in ['landscape', 'nature', 'scene']):
        category = 'landscape'
    elif any(kw in prompt.lower() for kw in ['product', 'commercial', 'brand']):
        category = 'product'
    elif any(kw in prompt.lower() for kw in ['fashion', 'clothing', 'style']):
        category = 'fashion'
    elif any(kw in prompt.lower() for kw in ['3d', 'render', 'blender']):
        category = '3d'
    elif any(kw in prompt.lower() for kw in ['illustration', 'drawing', 'art']):
        category = 'illustration'
    
    tags = []
    tag_keywords = {
        'cinematic': '电影感', 'vintage': '复古', 'minimalist': '极简',
        'futuristic': '未来', 'oriental': '东方', 'dramatic': '戏剧性',
        'cyberpunk': '赛博朋克', 'anime': '动漫'
    }
    for eng, chn in tag_keywords.items():
        if eng in prompt.lower():
            tags.append(chn)
    
    content = f"""---
title: "{title}"
slug: "prompt-{tweet_id}"
date: {date}
added: {datetime.now().strftime('%Y-%m-%d')}
author: "{author}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "unknown"
cover: "/images/prompts/prompt-{tweet_id}.jpg"
source: "https://x.com/i/status/{tweet_id}"
score: {total_score:.0f}/80
composition: {scores['composition']:.1f}/10
color: {scores['color']:.1f}/10
lighting: {scores['lighting']:.1f}/10
detail: {scores['detail']:.1f}/10
creativity: {scores['creativity']:.1f}/10
technical: {scores['technical']:.1f}/10
aesthetic: {scores['aesthetic']:.1f}/10
curation: {scores['curation']:.1f}/10
---

# {title}

**作者**: {author}  
**日期**: {date}  
**评分**: {total_score:.0f}/80

## 8维度评分

- 构图: {scores['composition']:.1f}/10
- 色彩: {scores['color']:.1f}/10
- 光影: {scores['lighting']:.1f}/10
- 细节: {scores['detail']:.1f}/10
- 创意: {scores['creativity']:.1f}/10
- 技术: {scores['technical']:.1f}/10
- 审美: {scores['aesthetic']:.1f}/10
- 策展: {scores['curation']:.1f}/10

## Prompt

```
{prompt}
```

## 图片

![cover](/images/prompts/prompt-{tweet_id}.jpg)
"""
    
    output_dir = Path(f"content/prompts/{category}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / f"prompt-{tweet_id}.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_path

def main():
    print("🔧 开始处理采集到的推文\n")
    
    tweets = load_tweets()
    if not tweets:
        print("没有推文需要处理")
        return
    
    print(f"📊 共 {len(tweets)} 条推文待处理\n")
    
    results = {
        'processed': 0,
        'accepted': 0,
        'rejected': 0
    }
    
    for tweet in tweets:
        tweet_id = tweet['id']
        print(f"\n{'='*60}")
        print(f"处理推文: {tweet_id}")
        print(f"{'='*60}")
        
        text = tweet.get('allText', '')
        prompt = extract_prompt(text)
        
        if not prompt or len(prompt) < 50:
            print("❌ 无法提取prompt或prompt太短")
            results['rejected'] += 1
            continue
        
        print(f"✅ 提取到prompt ({len(prompt)} 字符)")
        
        # 8维度评分
        images = tweet.get('imgs', [])
        scores, total_score = score_8_dimensions(prompt, images)
        print(f"📊 评分: {total_score:.0f}/80")
        print(f"   构图:{scores['composition']:.1f} 色彩:{scores['color']:.1f} 光影:{scores['lighting']:.1f} 细节:{scores['detail']:.1f}")
        print(f"   创意:{scores['creativity']:.1f} 技术:{scores['technical']:.1f} 审美:{scores['aesthetic']:.1f} 策展:{scores['curation']:.1f}")
        
        # 60分以上保留
        if total_score < 60:
            print(f"⏭️  评分低于60，跳过")
            results['rejected'] += 1
            continue
        
        # 生成标题
        title = generate_title(prompt)
        print(f"📝 生成标题: {title}")
        
        # 创建markdown文件
        md_path = create_markdown(tweet, prompt, title, scores, total_score)
        print(f"💾 创建文件: {md_path}")
        
        results['processed'] += 1
        results['accepted'] += 1
    
    print(f"\n{'='*60}")
    print(f"处理完成")
    print(f"{'='*60}")
    print(f"✅ 已处理: {results['processed']}")
    print(f"✅ 已接受（60分以上）: {results['accepted']}")
    print(f"❌ 已拒绝（60分以下）: {results['rejected']}")
    
    if results['accepted'] > 0:
        # 运行Prompt DNA分析
        print("\n🧬 运行 Prompt DNA 分析...")
        output, code = run("python3 scripts/analyze-prompt-dna.py")
        if code == 0:
            print("✅ Prompt DNA 分析成功")
        else:
            print(f"⚠️ Prompt DNA 分析失败:\n{output}")
        
        # 运行prebuild
        print("\n🔨 运行 prebuild...")
        output, code = run("npm run prebuild")
        if code == 0:
            print("✅ prebuild 成功")
        else:
            print(f"❌ prebuild 失败:\n{output}")
            return
        
        # 提交部署
        print("\n🚀 提交部署...")
        run("git add -A")
        run(f'git commit -m "feat: 自动采集 {results["accepted"]} 条提示词 ({datetime.now().strftime("%Y-%m-%d")})"')
        output, code = run("git push")
        if code == 0:
            print("✅ 部署成功")
        else:
            print(f"❌ 部署失败:\n{output}")

if __name__ == '__main__':
    main()
