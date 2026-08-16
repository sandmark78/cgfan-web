#!/usr/bin/env python3
"""
图片下载脚本：只对 LLM 评分通过的条目下载图片

输入：/tmp/llm_processed.json（包含评分结果的 JSON）
输出：下载图片到 public/images/prompts/

流程：
1. 读取 llm_processed.json
2. 过滤 score >= 60 的条目
3. 对每条下载其 image_urls 中的图片
4. 输出下载结果供后续步骤使用
"""

import json
import sys
import subprocess
from pathlib import Path

# 配置
IMAGES_DIR = Path('public/images/prompts')
LLM_PROCESSED = Path('/tmp/llm_processed.json')
SCORED_ITEMS = Path('/tmp/final_scored.json')

def download_image(img_url: str, save_path: Path) -> bool:
    """下载单张图片"""
    try:
        # 强制 JPG 格式
        img_url = img_url.replace('format=webp', 'format=jpg')
        if 'format=' not in img_url:
            img_url += '&format=jpg' if '?' in img_url else '?format=jpg'
        
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
    print(f"📥 读取评分结果: {SCORED_ITEMS}")
    
    if not SCORED_ITEMS.exists():
        print(f"❌ 文件不存在: {SCORED_ITEMS}")
        sys.exit(1)
    
    with open(SCORED_ITEMS, 'r', encoding='utf-8') as f:
        scored = json.load(f)
    
    # 过滤 >= 60 分
    valid = [item for item in scored if item.get('total', 0) >= 60]
    print(f"📦 通过评分: {len(valid)} 条\n")
    
    if not valid:
        print("⚠️ 无需要下载的图片")
        return
    
    # 读取原始数据获取 image_urls
    if not LLM_PROCESSED.exists():
        print(f"❌ 文件不存在: {LLM_PROCESSED}")
        sys.exit(1)
    
    with open(LLM_PROCESSED, 'r', encoding='utf-8') as f:
        processed = json.load(f)
    
    # 建立映射
    processed_map = {item['tweet_id']: item for item in processed}
    
    # 下载图片
    downloaded_count = 0
    for item in valid:
        tweet_id = item['id']
        title = item.get('title', '')
        
        # 获取 image_urls
        orig = processed_map.get(tweet_id, {})
        image_urls = orig.get('image_urls', [])
        
        if not image_urls:
            print(f"⚠️ {tweet_id} 无图片URL")
            continue
        
        print(f"📸 {tweet_id} - {title}")
        print(f"   下载 {len(image_urls)} 张图片...")
        
        downloaded_images = []
        for i, img_url in enumerate(image_urls[:4]):  # 最多4张
            # 命名规则
            if i == 0:
                filename = f"prompt-{tweet_id}.jpg"
            else:
                filename = f"prompt-{tweet_id}-{i+1}.jpg"
            
            save_path = IMAGES_DIR / filename
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            if download_image(img_url, save_path):
                downloaded_images.append(f"/images/prompts/{filename}")
                print(f"  ✅ {filename}")
            else:
                print(f"  ❌ {filename} 下载失败")
        
        if downloaded_images:
            # 更新 item 的 images 字段
            item['images'] = downloaded_images
            downloaded_count += 1
            print(f"   ✅ 完成 {len(downloaded_images)} 张\n")
        else:
            print(f"   ❌ 全部失败\n")
    
    # 保存更新后的数据
    with open(SCORED_ITEMS, 'w', encoding='utf-8') as f:
        json.dump(valid, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"📊 下载完成")
    print(f"  通过评分: {len(valid)} 条")
    print(f"  成功下载: {downloaded_count} 条")
    print(f"💾 已更新: {SCORED_ITEMS}")

if __name__ == "__main__":
    main()
