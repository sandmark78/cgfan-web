#!/usr/bin/env python3
"""
下载候选图片到本地
"""

import json
import os
import sys
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

def download_image(url, output_path):
    """下载单张图片"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return True, url, None
    except Exception as e:
        return False, url, str(e)

def download_all_images():
    """下载所有候选图片"""
    # 加载候选数据
    with open('candidates.json', 'r', encoding='utf-8') as f:
        candidates = json.load(f)
    
    # 创建图片目录
    img_dir = Path('images')
    img_dir.mkdir(exist_ok=True)
    
    # 收集所有图片 URL
    download_tasks = []
    for item in candidates:
        item_id = item['id']
        images = item.get('images', [])
        
        for i, img_url in enumerate(images):
            # 生成文件名
            if len(images) == 1:
                filename = f"{item_id}.jpg"
            else:
                filename = f"{item_id}_{i+1}.jpg"
            
            output_path = img_dir / filename
            
            # 检查是否已下载
            if output_path.exists():
                continue
            
            download_tasks.append((img_url, output_path))
    
    print(f"待下载图片: {len(download_tasks)} 张")
    
    if not download_tasks:
        print("所有图片已下载完成！")
        return
    
    # 并发下载
    success_count = 0
    fail_count = 0
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(download_image, url, path): (url, path) 
                   for url, path in download_tasks}
        
        for i, future in enumerate(as_completed(futures), 1):
            success, url, error = future.result()
            
            if success:
                success_count += 1
            else:
                fail_count += 1
                print(f"[{i}/{len(download_tasks)}] 失败: {url} - {error}")
            
            if i % 100 == 0:
                print(f"[{i}/{len(download_tasks)}] 成功: {success_count}, 失败: {fail_count}")
    
    print(f"\n下载完成！")
    print(f"成功: {success_count} 张")
    print(f"失败: {fail_count} 张")

if __name__ == '__main__':
    download_all_images()
