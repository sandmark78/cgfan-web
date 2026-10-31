#!/usr/bin/env python3
"""
修复缺失封面图片的脚本

功能：
1. 查询数据库中 cover 字段为空的记录
2. 从源链接重新获取图片URL
3. 下载图片到 public/images/prompts/
4. 更新数据库的 cover 字段
"""

import json
import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase_utils import get_client

# 导入下载函数
sys.path.insert(0, str(Path(__file__).parent / 'auto-collect'))
from download_images import download_image

IMAGES_DIR = Path('public/images/prompts')

def get_tweet_images(tweet_url):
    """从推文URL获取图片列表（使用Camofox）"""
    try:
        # 提取推文ID
        tweet_id = tweet_url.split('/')[-1]
        
        # 使用Camofox获取推文数据
        result = subprocess.run(
            ['node', 'scripts/get-tweet-images.js', tweet_id],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            return data.get('images', [])
        else:
            print(f"  ❌ 获取失败: {result.stderr}")
            return []
    except Exception as e:
        print(f"  ❌ 异常: {e}")
        return []

def main():
    print("🔍 查询缺失封面的记录...\n")
    
    supabase = get_client()
    
    # 查询 cover 字段为空的记录
    result = supabase.table('prompts').select('*').eq('cover', '').execute()
    missing = result.data
    
    if not missing:
        print("✅ 没有缺失封面的记录")
        return
    
    print(f"📦 找到 {len(missing)} 条缺失封面的记录\n")
    
    # 按日期分组显示
    by_date = {}
    for item in missing:
        date = item['added'][:10]
        by_date.setdefault(date, []).append(item)
    
    for date in sorted(by_date.keys(), reverse=True):
        print(f"  {date}: {len(by_date[date])} 条")
    
    print()
    
    # 检查 markdown 文件
    print("🔍 检查 markdown 文件...")
    prompts_dir = Path('content/prompts')
    
    fixed_count = 0
    failed_count = 0
    no_md_count = 0
    
    for item in missing:
        slug = item['slug']
        source = item.get('source', '')
        title = item.get('title', '未命名')
        
        print(f"\n{'='*60}")
        print(f"📸 处理: {slug}")
        print(f"   标题: {title}")
        print(f"   来源: {source}")
        
        # 查找对应的 markdown 文件
        md_files = list(prompts_dir.rglob(f"{slug}.md"))
        
        if not md_files:
            print(f"   ⚠️ 未找到 markdown 文件，跳过")
            no_md_count += 1
            continue
        
        md_file = md_files[0]
        print(f"   📄 Markdown: {md_file.relative_to(prompts_dir)}")
        
        # 从 markdown 文件中提取图片路径
        content = md_file.read_text(encoding='utf-8')
        
        # 查找图片引用
        import re
        img_pattern = r'!\[.*?\]\((/images/prompts/[^)]+)\)'
        matches = re.findall(img_pattern, content)
        
        if not matches:
            print(f"   ⚠️ Markdown 中未找到图片引用")
            no_md_count += 1
            continue
        
        # 检查第一张图片是否存在
        img_path = matches[0]
        full_path = Path('public') / img_path.lstrip('/')
        
        if full_path.exists():
            print(f"   ✅ 图片已存在: {img_path}")
            # 更新数据库
            try:
                supabase.table('prompts').update({
                    'cover': img_path
                }).eq('slug', slug).execute()
                
                print(f"   ✅ 数据库已更新: {img_path}")
                fixed_count += 1
            except Exception as e:
                print(f"   ❌ 数据库更新失败: {e}")
                failed_count += 1
        else:
            print(f"   ❌ 图片文件不存在: {full_path}")
            failed_count += 1
    
    # 汇总
    print(f"\n{'='*60}")
    print(f"📊 修复完成")
    print(f"{'='*60}")
    print(f"✅ 成功修复: {fixed_count} 条")
    print(f"❌ 修复失败: {failed_count} 条")
    print(f"⚠️ 无 markdown: {no_md_count} 条")
    print(f"📦 总计: {len(missing)} 条")

if __name__ == '__main__':
    main()
