#!/usr/bin/env python3
"""
修复 2026-08-23 采集的多图缺失问题
"""
import json
import re
import subprocess
from pathlib import Path

def main():
    # 读取预处理数据
    preprocessed_file = Path('data/auto-collect/preprocessed.json')
    with open(preprocessed_file) as f:
        preprocessed = json.load(f)
    
    url_map = {item['tweet_id']: item['image_urls'] for item in preprocessed}
    
    md_dir = Path('content/prompts/2026/08/23')
    fixed = 0
    
    for md_file in sorted(md_dir.glob('prompt-*.md')):
        match = re.search(r'prompt-(\d+)', md_file.name)
        if not match:
            continue
        tid = match.group(1)
        if tid not in url_map:
            continue
        urls = url_map[tid]
        if len(urls) <= 1:
            continue
        
        content = md_file.read_text()
        images_match = re.search(r'^images:\s*\n((?:\s+-\s+.+\n)*)', content, re.MULTILINE)
        if not images_match:
            continue
        current = [l.strip() for l in images_match.group(1).strip().split('\n') if l.strip()]
        
        if len(current) >= len(urls):
            continue
        
        # 需要修复
        image_paths = []
        for i, url in enumerate(urls):
            if i == 0:
                filename = f'prompt-{tid}.jpg'
            else:
                filename = f'prompt-{tid}-{i+1}.jpg'
            
            filepath = Path('public/images/prompts') / filename
            image_paths.append(f'/images/prompts/{filename}')
            
            # 下载如果不存在
            if not filepath.exists():
                url_clean = url.replace('format=webp', 'format=jpg')
                if 'format=' not in url_clean:
                    url_clean += '&format=jpg' if '?' in url_clean else '?format=jpg'
                
                result = subprocess.run(
                    ['curl', '-sL', '-o', str(filepath), url_clean],
                    timeout=10, capture_output=True
                )
                if result.returncode == 0 and filepath.exists() and filepath.stat().st_size > 0:
                    print(f'  ✅ 下载: {filename}')
                else:
                    print(f'  ❌ 下载失败: {filename}')
        
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
        
        # 更新 cover
        if image_paths:
            new_content = re.sub(
                r'^cover:\s*["\']?/images/prompts/[^"\']+["\']?',
                f'cover: "{image_paths[0]}"',
                new_content,
                flags=re.MULTILINE
            )
        
        md_file.write_text(new_content)
        fixed += 1
        print(f'✅ 修复: {md_file.name} ({len(urls)} 张图)')
    
    print(f'\n总计修复: {fixed} 个文件')
    if fixed > 0:
        print(f'\n下一步：')
        print(f'  git add -A')
        print(f'  git commit -m "fix: 补全多图缺失 ({fixed} 个文件)"')
        print(f'  npm run prebuild')
        print(f'  git push')

if __name__ == '__main__':
    main()
