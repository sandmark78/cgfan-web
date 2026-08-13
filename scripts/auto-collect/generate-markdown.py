#!/usr/bin/env python3
"""
生成markdown文件并部署

读取 data/auto-collect/evaluated.json（LLM处理结果），生成最终的markdown文件，
更新 prompts-data.ts，提交并推送。
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import PROJECT_ROOT, PROMPTS_DIR, IMAGES_DIR, EVALUATED

os.chdir(str(PROJECT_ROOT))

def download_image(img_url: str, output_path: str) -> bool:
    """下载图片"""
    try:
        # 转换URL格式
        if 'format=webp' in img_url:
            img_url = img_url.replace('format=webp', 'format=jpg')
        if 'name=medium' in img_url:
            img_url = img_url.replace('name=medium', 'name=large')
        
        # 下载图片
        result = subprocess.run(
            ['curl', '-L', '-o', output_path, img_url],
            capture_output=True,
            timeout=30
        )
        
        if result.returncode == 0 and Path(output_path).exists():
            # 检查文件大小
            size = Path(output_path).stat().st_size
            if size > 1000:  # 至少1KB
                return True
            else:
                Path(output_path).unlink()
                return False
        return False
    except Exception as e:
        print(f"  ❌ 下载失败: {e}")
        return False

def generate_markdown(result: Dict) -> bool:
    """生成单个markdown文件"""
    tweet_id = result['tweet_id']
    title = result['title']
    tags = result['tags']
    prompt = result['prompt']
    model = result['model']
    author = result['author']
    authorLink = result.get('authorLink', '')
    date = result['date']
    scores = result['scores']
    total_score = result['total_score']
    imgs = result.get('imgs', [])
    
    # 确定分类
    category = 'uncategorized'
    title_lower = title.lower()
    prompt_lower = prompt.lower()
    
    if any(kw in title_lower or kw in prompt_lower for kw in ['人像', 'portrait', '人物', 'cosplay', 'coser']):
        category = 'portrait'
    elif any(kw in title_lower or kw in prompt_lower for kw in ['产品', 'product', '包装', '品牌']):
        category = 'product'
    elif any(kw in title_lower or kw in prompt_lower for kw in ['海报', 'poster', '排版', 'typography']):
        category = 'poster'
    elif any(kw in title_lower or kw in prompt_lower for kw in ['时尚', 'fashion', '服装', '穿搭']):
        category = 'fashion'
    elif any(kw in title_lower or kw in prompt_lower for kw in ['3d', '3D', '三维', 'render']):
        category = '3d'
    elif any(kw in title_lower or kw in prompt_lower for kw in ['插画', 'illustration', '绘画']):
        category = 'illustration'
    elif any(kw in title_lower or kw in prompt_lower for kw in ['风景', 'landscape', '自然']):
        category = 'landscape'
    
    # 确定输出目录（直接写入 PROMPTS_DIR，归档由 archive-by-date.py 处理）
    output_dir = PROMPTS_DIR
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成文件名
    filename = f'prompt-{tweet_id}.md'
    filepath = output_dir / filename
    
    # 生成frontmatter
    today = datetime.now().strftime('%Y-%m-%d')
    added_ts = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00'
    frontmatter = f"""---
title: "{title}"
slug: "prompt-{tweet_id}"
date: {date}
added: "{added_ts}"
author: "{author}"
authorLink: "{authorLink}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "{model}"
cover: "/images/prompts/prompt-{tweet_id}.jpg"
source: "https://x.com/i/status/{tweet_id}"
score: {total_score}/80
composition: {scores.get('composition', 7)}/10
color: {scores.get('color', 7)}/10
lighting: {scores.get('lighting', 7)}/10
detail: {scores.get('detail', 7)}/10
creativity: {scores.get('creativity', 7)}/10
technical: {scores.get('technical', 7)}/10
aesthetic: {scores.get('aesthetic', 7)}/10
curation: {scores.get('curation', 7)}/10
---

# {title}

**作者**: {author}  
**日期**: {date}  
**评分**: {total_score}/80

## 8维度评分

- 构图: {scores.get('composition', 7)}/10
- 色彩: {scores.get('color', 7)}/10
- 光影: {scores.get('lighting', 7)}/10
- 细节: {scores.get('detail', 7)}/10
- 创意: {scores.get('creativity', 7)}/10
- 技术: {scores.get('technical', 7)}/10
- 审美: {scores.get('aesthetic', 7)}/10
- 策展: {scores.get('curation', 7)}/10

## Prompt

```
{prompt}
```
"""
    
    # 写入文件
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(frontmatter)
    
    print(f"  ✅ 生成: {filepath}")
    
    # 下载图片
    if imgs:
        img_url = imgs[0].get('src', '')
        if img_url:
            img_path = f'public/images/prompts/prompt-{tweet_id}.jpg'
            if download_image(img_url, img_path):
                print(f"  ✅ 下载图片: {img_path}")
            else:
                print(f"  ⚠️ 图片下载失败: {img_url}")
    
    return True

def main():
    """主流程"""
    print("📝 生成markdown文件并部署")
    print("=" * 60)
    
    # 读取LLM处理结果（从 data/auto-collect/evaluated.json）
    if not EVALUATED.exists():
        print(f"❌ 未找到处理结果: {EVALUATED}")
        return
    
    with open(EVALUATED, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    print(f"📥 读取到 {len(results)} 条处理结果")
    
    # 过滤：只处理 status='pass' 的
    passed_results = [r for r in results if r.get('status') == 'pass']
    print(f"✅ 通过评估: {len(passed_results)} 条")
    
    # 逐条生成markdown
    success_count = 0
    for result in passed_results:
        try:
            if generate_markdown(result):
                success_count += 1
        except Exception as e:
            print(f"  ❌ 生成失败: {result.get('tweet_id', 'unknown')} - {e}")
    
    print(f"\n📊 生成完成: {success_count}/{len(results)} 条成功")
    
    if success_count == 0:
        print("⚠️ 没有成功生成任何文件")
        return
    
    # 同步到 Supabase
    print("\n🔄 同步到 Supabase...")
    try:
        from scripts.supabase_utils import upsert_many
        
        # 从处理结果构建数据行
        supabase_rows = []
        for result in results:
            row = {
                'title': result.get('title', ''),
                'slug': f"prompt-{result['tweet_id']}",
                'model': result.get('model', ''),
                'category': result.get('category', 'uncategorized'),
                'tags': result.get('tags', []),
                'difficulty': 'intermediate',
                'cover': f"/images/prompts/prompt-{result['tweet_id']}.jpg",
                'images': [f"/images/prompts/prompt-{result['tweet_id']}.jpg"],
                'date': result.get('date', ''),
                'added': datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00',
                'source': f"https://x.com/i/status/{result['tweet_id']}",
                'source_link': f"https://x.com/i/status/{result['tweet_id']}",
                'author': result.get('author', ''),
                'prompt': result.get('prompt', ''),
            }
            supabase_rows.append(row)
        
        synced = upsert_many(supabase_rows)
        print(f"✅ Supabase 同步成功: {synced} 条")
    except Exception as e:
        print(f"⚠️ Supabase 同步异常: {e}")
    
    # 提交并推送
    print("\n🚀 提交并推送...")
    try:
        subprocess.run(['git', 'add', '-A'], check=True)
        
        commit_msg = f"feat: 采集 {success_count} 条新提示词 ({datetime.now().strftime('%Y-%m-%d')})"
        subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
        subprocess.run(['git', 'push', 'origin', 'main'], check=True)
        
        print("✅ 提交并推送成功")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ 提交推送失败: {e}")
    except Exception as e:
        print(f"⚠️ 提交推送异常: {e}")

if __name__ == "__main__":
    main()
