#!/usr/bin/env python3
"""
处理采集到的推文
- 提取prompt
- 生成中文标题（关键词匹配）
- 创建markdown文件（标记为待评分）
- 提交部署
- 评分由 AI 每天审核后完成
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
            # 返回最长的匹配
            return max(matches, key=lambda x: len(str(x)))
    
    # 如果没有明确标记，返回文本的前500字符
    return text[:500] if len(text) > 500 else text

def generate_title(prompt_text):
    """生成中文标题（关键词匹配）"""
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

def create_markdown(tweet, prompt, title):
    """创建markdown文件（标记为待评分）"""
    tweet_id = tweet['id']
    author = tweet.get('author', 'Unknown')
    date = tweet.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # 确定分类
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
    
    # 生成标签
    tags = []
    tag_keywords = {
        'cinematic': '电影感', 'vintage': '复古', 'minimalist': '极简',
        'futuristic': '未来', 'oriental': '东方', 'dramatic': '戏剧性',
        'cyberpunk': '赛博朋克', 'anime': '动漫'
    }
    for eng, chn in tag_keywords.items():
        if eng in prompt.lower():
            tags.append(chn)
    
    # 创建frontmatter（标记为待评分）
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
status: "待评分"
---

# {title}

**作者**: {author}  
**日期**: {date}  
**状态**: 待评分

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
    
    output_path = output_dir / f"prompt-{tweet_id}.md"
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
        
        if not prompt or len(prompt) < 50:
            print("❌ 无法提取prompt或prompt太短")
            results['rejected'] += 1
            continue
        
        print(f"✅ 提取到prompt ({len(prompt)} 字符)")
        
        # 生成标题
        title = generate_title(prompt)
        print(f"📝 生成标题: {title}")
        
        # 创建markdown文件（标记为待评分）
        md_path = create_markdown(tweet, prompt, title)
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
            print(f"\n📋 提示: {results['accepted']} 条提示词已标记为'待评分'，请 AI 审核后完成 8 维度评分")
        else:
            print(f"❌ 部署失败:\n{output}")

if __name__ == '__main__':
    main()
