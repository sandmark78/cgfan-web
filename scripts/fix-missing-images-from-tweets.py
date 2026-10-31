#!/usr/bin/env python3
"""
从推文链接重新获取并下载缺失的图片

流程：
1. 查询 cover 为空的记录
2. 使用 Camofox CLI 从推文链接获取图片URL
3. 下载图片到 public/images/prompts/
4. 更新数据库和 markdown 文件
"""

import json
import subprocess
import sys
import re
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))
from supabase_utils import get_client

IMAGES_DIR = Path('public/images/prompts')

def run(cmd, timeout=30):
    """执行命令，返回 stdout。超时返回空字符串，不抛异常"""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except subprocess.TimeoutExpired:
        return ""

def camofox_cmd(cmd, timeout=30):
    """执行 camofox 命令"""
    return run(f"camofox {cmd}", timeout=timeout)

def download_image(img_url: str, save_path: Path) -> bool:
    """下载单张图片（使用 requests 绕过反爬虫）"""
    try:
        import requests
        
        # 强制 JPG 格式
        img_url = img_url.replace('format=webp', 'format=jpg')
        if 'format=' not in img_url:
            img_url += '&format=jpg' if '?' in img_url else '?format=jpg'
        
        # 模拟浏览器请求头
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://x.com/',
        }
        
        response = requests.get(img_url, headers=headers, timeout=30)
        
        if response.status_code == 200 and len(response.content) > 0:
            # 写入文件
            with open(save_path, 'wb') as f:
                f.write(response.content)
            
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

def get_tweet_images_with_camofox(tweet_url: str):
    """使用 Camofox CLI 从推文获取图片URL"""
    try:
        # 提取推文ID
        tweet_id = tweet_url.split('/')[-1]
        
        # 打开推文页面
        out = camofox_cmd(f'open "{tweet_url}" 2>&1', timeout=60)
        m = re.search(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', out)
        if not m:
            print(f"    ❌ 打开页面失败")
            return []
        
        tab = m.group()
        print(f"    📄 Tab: {tab[:8]}...")
        
        # 等待页面加载
        run("sleep 3")
        
        # 提取图片URL
        extract_js = """JSON.stringify({
  imgs: (() => {
    const firstArticle = document.querySelector("article");
    if (!firstArticle) return [];
    return Array.from(firstArticle.querySelectorAll("img"))
      .filter(img => img.src.includes("pbs.twimg.com/media/"))
      .slice(0, 4)
      .map(img => ({ src: img.src, alt: img.alt || "" }));
  })()
})"""
        
        with open("/tmp/extract_tweet_images.js", "w") as f:
            f.write(extract_js)
        
        out = camofox_cmd(f'eval "$(cat /tmp/extract_tweet_images.js)" "{tab}" 2>&1', timeout=15)
        
        # 关闭 tab
        camofox_cmd(f'close "{tab}" 2>/dev/null')
        
        # 解析结果
        for line in out.split('\n'):
            if line.startswith('result:'):
                try:
                    data = json.loads(line[7:].strip())
                    imgs = data.get('imgs', [])
                    return [img['src'] for img in imgs if img.get('src')]
                except:
                    pass
        
        return []
    except Exception as e:
        print(f"    ❌ 异常: {e}")
        return []

def update_markdown_file(md_path: Path, cover_path: str, images: list):
    """更新 markdown 文件的 cover 和 images 字段"""
    content = md_path.read_text(encoding='utf-8')
    
    # 更新 cover 字段
    content = re.sub(
        r'cover:\s*["\'].*?["\']',
        f'cover: "{cover_path}"',
        content
    )
    
    # 更新 images 字段
    images_json = json.dumps(images, ensure_ascii=False)
    content = re.sub(
        r'images:\s*\[.*?\]',
        f'images: {images_json}',
        content
    )
    
    # 添加图片引用到末尾（如果没有）
    if '![' not in content:
        content += f'\n\n## Images\n\n![cover]({cover_path})\n'
    
    md_path.write_text(content, encoding='utf-8')

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
    
    # 处理每条记录
    fixed_count = 0
    failed_count = 0
    
    for item in missing:
        slug = item['slug']
        source = item.get('source', '')
        title = item.get('title', '未命名')
        
        print(f"\n{'='*60}")
        print(f"📸 处理: {slug}")
        print(f"   标题: {title}")
        print(f"   来源: {source}")
        
        if not source:
            print(f"   ⚠️ 无源链接，跳过")
            failed_count += 1
            continue
        
        # 查找对应的 markdown 文件
        prompts_dir = Path('content/prompts')
        md_files = list(prompts_dir.rglob(f"{slug}.md"))
        
        if not md_files:
            print(f"   ⚠️ 未找到 markdown 文件，跳过")
            failed_count += 1
            continue
        
        md_file = md_files[0]
        print(f"   📄 Markdown: {md_file.relative_to(prompts_dir)}")
        
        # 使用 Camofox 获取图片URL
        print(f"   🔍 从推文获取图片URL...")
        image_urls = get_tweet_images_with_camofox(source)
        
        if not image_urls:
            print(f"   ❌ 未找到图片")
            failed_count += 1
            continue
        
        print(f"   ✅ 找到 {len(image_urls)} 张图片")
        
        # 下载图片
        downloaded_images = []
        for i, img_url in enumerate(image_urls[:4]):  # 最多4张
            if i == 0:
                filename = f"{slug}.jpg"
            else:
                filename = f"{slug}-{i+1}.jpg"
            
            save_path = IMAGES_DIR / filename
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            print(f"   📥 下载: {filename}")
            if download_image(img_url, save_path):
                img_path = f"/images/prompts/{filename}"
                downloaded_images.append(img_path)
                print(f"   ✅ 下载成功")
            else:
                print(f"   ❌ 下载失败")
        
        if downloaded_images:
            cover_path = downloaded_images[0]
            
            # 更新数据库
            try:
                supabase.table('prompts').update({
                    'cover': cover_path,
                    'images': downloaded_images
                }).eq('slug', slug).execute()
                
                print(f"   ✅ 数据库已更新")
                
                # 更新 markdown 文件
                update_markdown_file(md_file, cover_path, downloaded_images)
                print(f"   ✅ Markdown 已更新")
                
                fixed_count += 1
            except Exception as e:
                print(f"   ❌ 更新失败: {e}")
                failed_count += 1
        else:
            print(f"   ❌ 全部下载失败")
            failed_count += 1
    
    # 汇总
    print(f"\n{'='*60}")
    print(f"📊 修复完成")
    print(f"{'='*60}")
    print(f"✅ 成功修复: {fixed_count} 条")
    print(f"❌ 修复失败: {failed_count} 条")
    print(f"📦 总计: {len(missing)} 条")

if __name__ == '__main__':
    main()
