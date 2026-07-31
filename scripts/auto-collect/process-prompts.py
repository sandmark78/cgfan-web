#!/usr/bin/env python3
"""
处理采集到的推文
- 提取prompt
- 评分（60分以上保留）
- 生成中文标题
- 创建markdown文件
- 下载图片
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
        r'(["\'])([\s\S]+?)\1'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # 返回最长的匹配
            return max(matches, key=lambda x: len(str(x)))
    
    # 如果没有明确标记，返回文本的前500字符
    return text[:500] if len(text) > 500 else text

def score_prompt(prompt_text, images):
    """评分prompt（简化版）"""
    # 基于关键词的简单评分
    score = 50  # 基础分
    
    # 加分项
    keywords = {
        'cinematic': 5, 'dramatic': 5, 'moody': 3,
        'minimalist': 4, 'clean': 3, 'elegant': 3,
        'vintage': 4, 'retro': 4, 'nostalgic': 3,
        'futuristic': 4, 'sci-fi': 4, 'cyberpunk': 3,
        'oriental': 5, 'chinese': 4, 'japanese': 4,
        'detailed': 3, 'intricate': 3, 'complex': 2,
        'lighting': 3, 'atmosphere': 3, 'mood': 3
    }
    
    prompt_lower = prompt_text.lower()
    for keyword, points in keywords.items():
        if keyword in prompt_lower:
            score += points
    
    # 图片加分
    if images:
        score += min(len(images) * 2, 10)
    
    # 长度加分（适中的长度）
    length = len(prompt_text)
    if 200 <= length <= 800:
        score += 5
    elif length > 800:
        score += 3
    
    return min(score, 100)

def generate_title(prompt_text):
    """生成中文标题"""
    # 提取关键词生成标题
    keywords = []
    
    # 查找风格词
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
    
    # 查找主题词
    subject_words = {
        'portrait': '人像', 'landscape': '风景', 'city': '城市',
        'architecture': '建筑', 'nature': '自然', 'character': '角色',
        'product': '产品', 'fashion': '时尚', 'food': '美食'
    }
    
    for eng, chn in subject_words.items():
        if eng in prompt_lower:
            keywords.append(chn)
            break
    
    # 组合标题
    if keywords:
        title = '与'.join(keywords[:2]) + '风格'
    else:
        title = '创意视觉'
    
    return title

def create_markdown(tweet, prompt, title, score):
    """创建markdown文件"""
    tweet_id = tweet['id']
    author = tweet.get('author', 'Unknown')
    date = tweet.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # 确定分类
    category = 'uncategorized'
    if any(kw in prompt.lower() for kw in ['portrait', 'person', 'character']):
        category = 'character'
    elif any(kw in prompt.lower() for kw in ['landscape', 'nature', 'scene']):
        category = 'scene'
    elif any(kw in prompt.lower() for kw in ['product', 'commercial', 'brand']):
        category = 'product'
    elif any(kw in prompt.lower() for kw in ['fashion', 'clothing', 'style']):
        category = 'fashion'
    
    # 生成标签
    tags = []
    tag_keywords = {
        'cinematic': '电影感', 'vintage': '复古', 'minimalist': '极简',
        'futuristic': '未来', 'oriental': '东方', 'dramatic': '戏剧性'
    }
    for eng, chn in tag_keywords.items():
        if eng in prompt.lower():
            tags.append(chn)
    
    # 创建frontmatter
    content = f"""---
title: "{title}"
slug: "prompt-{tweet_id}"
date: {date}
author: "{author}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "unknown"
cover: "/images/prompts/prompt-{tweet_id}.jpg"
score: {score}
---

# {title}

**作者**: {author}  
**日期**: {date}  
**评分**: {score}/100

## Prompt

```
{prompt}
```

## 图片

![cover](/images/prompts/prompt-{tweet_id}.jpg)
"""
    
    # 保存文件
    output_dir = Path(f"content/prompts/{category}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / f"{title}.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_path

def main():
    print("🔧 开始处理采集到的推文\n")
    
    # 加载推文数据
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
        
        # 提取prompt
        text = tweet.get('allText', '')
        prompt = extract_prompt(text)
        
        if not prompt:
            print("❌ 无法提取prompt")
            continue
        
        print(f"✅ 提取到prompt ({len(prompt)} 字符)")
        
        # 评分
        images = tweet.get('imgs', [])
        score = score_prompt(prompt, images)
        print(f"📊 评分: {score}/100")
        
        # 判断是否接受（60分以上）
        if score < 60:
            print(f"⏭️  评分低于60，跳过")
            results['rejected'] += 1
            continue
        
        # 生成标题
        title = generate_title(prompt)
        print(f"📝 生成标题: {title}")
        
        # 创建markdown文件
        md_path = create_markdown(tweet, prompt, title, score)
        print(f"💾 创建文件: {md_path}")
        
        results['processed'] += 1
        results['accepted'] += 1
    
    print(f"\n{'='*60}")
    print(f"处理完成")
    print(f"{'='*60}")
    print(f"✅ 已处理: {results['processed']}")
    print(f"✅ 已接受: {results['accepted']}")
    print(f"❌ 已拒绝: {results['rejected']}")
    
    if results['accepted'] > 0:
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
