#!/usr/bin/env python3
"""
自动采集高分作者推文
每天运行，抓取指定作者最近24小时的推文
"""

import json
import subprocess
import re
from pathlib import Path
from datetime import datetime, timedelta

def load_authors():
    """加载作者列表"""
    config_path = Path(__file__).parent / 'authors.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def fetch_author_tweets(twitter_handle):
    """使用Camofox抓取作者推文"""
    username = twitter_handle.replace('@', '')
    url = f"https://x.com/{username}"
    
    print(f"🔍 抓取 {twitter_handle} 的推文...")
    
    # 使用Camofox打开页面
    result = subprocess.run(
        ['camofox', 'open', url, '--viewport', '1280x720'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"❌ 打开页面失败: {result.stderr}")
        return None
    
    # 等待页面加载
    import time
    time.sleep(3)
    
    # 获取页面内容
    snapshot_result = subprocess.run(
        ['camofox', 'snapshot'],
        capture_output=True,
        text=True
    )
    
    # 关闭标签
    subprocess.run(['camofox', 'close'], capture_output=True)
    
    return snapshot_result.stdout

def extract_tweets_with_images(page_content):
    """从页面内容中提取包含图片的推文"""
    # 这里需要解析Camofox返回的快照
    # 暂时返回空列表，后续完善
    tweets = []
    
    # TODO: 解析页面内容，提取推文
    # 1. 找到所有推文块
    # 2. 检查是否有图片
    # 3. 提取推文文本、图片URL、时间
    
    return tweets

def extract_prompt_from_tweet(tweet_text):
    """从推文中提取prompt"""
    # 使用现有的提取逻辑
    # 检查多种格式：Prompt:、提示词：、正文中的prompt等
    
    # 暂时返回None，后续集成现有提取代码
    return None

def score_prompt(prompt, images):
    """AI评分（8维度）"""
    # TODO: 实现AI评分逻辑
    # 使用现有的评分标准
    # 返回分数和详细信息
    
    return {
        'score': 65,  # 临时分数
        'details': {}
    }

def main():
    config = load_authors()
    authors = config['authors']
    min_score = config['min_score']
    
    print(f"🚀 开始自动采集，共 {len(authors)} 位作者")
    print(f"📊 最低分数要求: {min_score}分\n")
    
    all_new_prompts = []
    
    for author in authors:
        print(f"\n{'='*60}")
        print(f"作者: {author['name']} ({author['twitter']})")
        print(f"历史平均分: {author['avg_score']}")
        print(f"{'='*60}\n")
        
        # 抓取推文
        page_content = fetch_author_tweets(author['twitter'])
        if not page_content:
            continue
        
        # 提取包含图片的推文
        tweets = extract_tweets_with_images(page_content)
        print(f"找到 {len(tweets)} 条包含图片的推文")
        
        # 处理每条推文
        for tweet in tweets:
            prompt = extract_prompt_from_tweet(tweet['text'])
            if not prompt:
                continue
            
            # 评分
            score_result = score_prompt(prompt, tweet['images'])
            
            if score_result['score'] >= min_score:
                print(f"✅ 新提示词: {score_result['score']}分")
                all_new_prompts.append({
                    'author': author['name'],
                    'prompt': prompt,
                    'score': score_result['score'],
                    'images': tweet['images']
                })
            else:
                print(f"⏭️  跳过: {score_result['score']}分 < {min_score}分")
    
    print(f"\n{'='*60}")
    print(f"采集完成，共 {len(all_new_prompts)} 条新提示词")
    print(f"{'='*60}\n")
    
    # 保存结果
    output_path = Path(__file__).parent / 'new_prompts.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_new_prompts, f, ensure_ascii=False, indent=2)
    
    print(f"💾 结果已保存到: {output_path}")

if __name__ == '__main__':
    main()
