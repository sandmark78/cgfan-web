#!/usr/bin/env python3
"""
预处理脚本 v2.0：只做过滤/去重，prompt 提取交给 LLM

脚本负责：
- 过滤视频内容
- 去重检查（基于 source URL）
- 提取基本信息（author, date, images）
- 下载图片
- 输出完整数据供 LLM 处理

LLM 负责：
- 提取 prompt（从 allText / imgs alt / 评论区）
- 判断内容类型（人像写真/产品/插画等）
- 过滤不合格内容
- 标题生成、标签提取、评分
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

# 兼容旧路径：如果 tweets_batch.json 在 /tmp 也有，优先用 data/ 下的
# 但 fetch-tweets.py 可能写到 /tmp，做个 fallback
import shutil
TMP_TWEETS = Path('/tmp/tweets_batch.json')
if not TWEETS_BATCH.exists() and TMP_TWEETS.exists():
    shutil.copy(TMP_TWEETS, TWEETS_BATCH)

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

def download_image(img_url: str, save_path: Path) -> bool:
    """下载单张图片"""
    try:
        # 强制 JPG 格式
        img_url = img_url.replace('format=webp', 'format=jpg')
        if 'format=' not in img_url:
            img_url += '&format=jpg' if '?' in img_url else '?format=jpg'
        
        import subprocess
        result = subprocess.run(
            ['curl', '-sL', '-o', str(save_path), img_url],
            timeout=15, capture_output=True
        )
        
        if result.returncode == 0 and save_path.exists() and save_path.stat().st_size > 0:
            # 检查是否真的是 JPEG
            file_result = subprocess.run(
                ['file', str(save_path)], capture_output=True, text=True
            )
            if 'JPEG' not in file_result.stdout and 'WebP' in file_result.stdout:
                # WebP 伪装，转换
                subprocess.run(
                    ['sips', '-s', 'format', 'jpeg', str(save_path), '--out', str(save_path)],
                    capture_output=True
                )
            return True
        return False
    except Exception as e:
        print(f"    ❌ 下载失败: {e}")
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
        
        # 提取基本信息（不做 prompt 提取，交给 LLM）
        author = tweet.get('author', 'Unknown')
        author_link = tweet.get('authorLink', '')
        date = tweet.get('date', '')
        all_text = tweet.get('allText', '')
        imgs = tweet.get('imgs', [])
        
        # 检查是否有图片
        if not imgs:
            print(f"⚠️ 无图片: {tweet_id}")
            continue
        
        # 下载图片
        downloaded_images = []
        for i, img in enumerate(imgs[:4]):  # 最多4张
            img_url = img.get('src', '')
            if not img_url:
                continue
            
            # 命名规则
            if i == 0:
                filename = f"prompt-{tweet_id}.jpg"
            else:
                filename = f"prompt-{tweet_id}-{i+1}.jpg"
            
            save_path = Path(IMAGES_DIR) / filename
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            if download_image(img_url, save_path):
                downloaded_images.append(f"/images/prompts/{filename}")
                print(f"  ✅ 图片 {i+1}: {filename}")
            else:
                print(f"  ❌ 图片 {i+1} 下载失败")
        
        if not downloaded_images:
            print(f"⚠️ 无图片下载成功: {tweet_id}")
            continue
        
        # 保存完整数据供 LLM 处理
        preprocessed.append({
            'tweet_id': tweet_id,
            'author': author,
            'authorLink': author_link,
            'date': date,
            'allText': all_text,  # 完整文本，LLM 提取 prompt
            'imgs': imgs,  # 图片元数据（含 alt）
            'images': downloaded_images,  # 本地图片路径
            'source': f"https://x.com/i/status/{tweet_id}"
        })
        
        print(f"✅ 预处理: {tweet_id} ({len(downloaded_images)} 张图片)\n")
    
    print(f"\n{'='*60}")
    print(f"📊 预处理完成")
    print(f"  总计: {len(tweets)} 条")
    print(f"  视频: {skipped_video} 条")
    print(f"  重复: {skipped_duplicate} 条")
    print(f"  通过: {len(preprocessed)} 条")
    
    # 保存供 LLM 处理
    if preprocessed:
        output_file = PREPROCESSED
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(preprocessed, f, ensure_ascii=False, indent=2)
        print(f"\n💾 数据已保存: {output_file}")
        print(f"🤖 请在下一轮用 LLM 处理这些数据（提取 prompt、评分、生成 markdown）")
    else:
        print("\n⚠️ 无有效数据")

if __name__ == "__main__":
    main()
