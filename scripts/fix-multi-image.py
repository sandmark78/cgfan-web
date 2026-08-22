#!/usr/bin/env python3
"""
修复多图缺失问题
检查今天采集的 markdown 文件，如果原推文有多张图片但 markdown 只记录了1张，
则下载缺失的图片并更新 markdown 文件。
"""
import json
import re
import subprocess
from pathlib import Path

def main():
    # 读取预处理数据（有完整 image_urls）
    preprocessed_file = Path('data/auto-collect/preprocessed.json')
    if not preprocessed_file.exists():
        print(f"❌ 文件不存在: {preprocessed_file}")
        return
    
    with open(preprocessed_file, 'r') as f:
        preprocessed = json.load(f)
    
    # 建立 ID -> image_urls 映射
    url_map = {item['tweet_id']: item['image_urls'] for item in preprocessed}
    
    # 检查今天的 markdown 文件
    md_dir = Path('content/prompts/2026/08/23')
    if not md_dir.exists():
        print(f"❌ 目录不存在: {md_dir}")
        return
    
    fixed = 0
    for md_file in sorted(md_dir.glob('prompt-*.md')):
        # 从文件名提取 ID
        match = re.search(r'prompt-(\d+)', md_file.name)
        if not match:
            continue
        tweet_id = match.group(1)
        
        if tweet_id not in url_map:
            continue
        
        urls = url_map[tweet_id]
        if len(urls) <= 1:
            continue  # 只有1张图，不需要修复
        
        # 读取 markdown
        content = md_file.read_text()
        
        # 检查当前 images: 数组有几张
        images_match = re.search(r'^images:\s*\n((?:\s+-\s+.+\n)*)', content, re.MULTILINE)
        if not images_match:
            continue
        
        current_images = [line.strip() for line in images_match.group(1).strip().split('\n') if line.strip()]
        if len(current_images) >= len(urls):
            continue  # 已经有足够的图片
        
        print(f"\n📝 修复: {md_file.name}")
        print(f"   原推文有 {len(urls)} 张图，markdown 只有 {len(current_images)} 张")
        
        # 下载缺失的图片
        image_paths = []
        for i, url in enumerate(urls):
            if i == 0:
                filename = f'prompt-{tweet_id}.jpg'
            else:
                filename = f'prompt-{tweet_id}-{i+1}.jpg'
            
            filepath = Path('public/images/prompts') / filename
            image_paths.append(f'/images/prompts/{filename}')
            
            # 下载如果不存在
            if not filepath.exists():
                url_clean = url.replace('format=webp', 'format=jpg')
                if 'format=' not in url_clean:
                    url_clean += '&format=jpg' if '?' in url_clean else '?format=jpg'
                
                result = subprocess.run(
                    ['curl', '-sL', '-o', str(filepath), url_clean],
                    timeout=15, capture_output=True
                )
                if result.returncode == 0 and filepath.exists() and filepath.stat().st_size > 0:
                    print(f'  ✅ 下载: {filename}')
                else:
                    print(f'  ❌ 下载失败: {filename}')
                    continue
        
        # 构建新的 images: 数组
        new_images_yaml = 'images:\n'
        for path in image_paths:
            new_images_yaml += f'  - "{path}"\n'
        
        # 替换 markdown 中的 images: 部分
        new_content = re.sub(
            r'^images:\s*\n((?:\s+-\s+.+\n)*)',
            new_images_yaml.rstrip(),
            content,
            flags=re.MULTILINE
        )
        
        # 同时更新 cover（确保是第一张）
        if image_paths:
            new_content = re.sub(
                r'^cover:\s*["\']?/images/prompts/[^"\']+["\']?',
                f'cover: "{image_paths[0]}"',
                new_content,
                flags=re.MULTILINE
            )
        
        md_file.write_text(new_content)
        fixed += 1
        print(f'  ✅ 已更新 markdown ({len(image_paths)} 张图)')
    
    print(f'\n{"="*60}')
    print(f'总计修复: {fixed} 个文件')
    
    if fixed > 0:
        print(f'\n下一步：')
        print(f'  git add -A')
        print(f'  git commit -m "fix: 补全多图缺失 ({fixed} 个文件)"')
        print(f'  git push')

if __name__ == '__main__':
    main()
