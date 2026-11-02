#!/usr/bin/env python3
"""
图片下载脚本 v3.0：使用 camofox 浏览器下载 Twitter 图片

问题背景：
- Twitter CDN (pbs.twimg.com) 直接 curl 会被拒绝连接 (Connection reset)
- 需要通过浏览器 fetch API 下载

输入：/tmp/final_scored.json（包含评分结果的 JSON）
输出：下载图片到 public/images/prompts/

流程：
1. 读取 final_scored.json
2. 过滤 score >= 55 的条目
3. 使用 camofox 浏览器打开推文页面，获取图片 URL
4. 通过浏览器 fetch API 下载 thumb 尺寸图片（避免 truncated）
5. 解码 base64 保存为 JPEG
"""

import json
import sys
import subprocess
import time
import re
import base64
from pathlib import Path

# 配置
IMAGES_DIR = Path('public/images/prompts')
LLM_PROCESSED = Path('/tmp/llm_processed.json')
SCORED_ITEMS = Path('/tmp/final_scored.json')
CAMOFOX = Path('/Users/mac/.local/bin/camofox')


def open_browser_tab(url: str) -> str | None:
    """打开浏览器标签，返回 tab_id"""
    result = subprocess.run(
        [str(CAMOFOX), 'open', url],
        capture_output=True, text=True, timeout=30
    )
    match = re.search(r'tabId:\s*([a-f0-9-]+)', result.stdout)
    if match:
        return match.group(1)
    return None


def close_browser_tab(tab_id: str):
    """关闭浏览器标签"""
    subprocess.run(
        [str(CAMOFOX), 'close', tab_id],
        capture_output=True, text=True, timeout=30
    )


def navigate_tab(tab_id: str, url: str) -> bool:
    """导航标签到指定 URL"""
    result = subprocess.run(
        [str(CAMOFOX), 'navigate', url, tab_id],
        capture_output=True, text=True, timeout=30
    )
    return 'ok: true' in result.stdout or result.returncode == 0


def get_image_urls_from_page(tab_id: str) -> list:
    """从当前页面获取图片 URL"""
    js_code = '''
    Array.from(document.querySelectorAll("article img[src*='pbs.twimg.com/media']"))
        .map(img => img.src)
    '''
    result = subprocess.run(
        [str(CAMOFOX), 'eval', js_code, tab_id],
        capture_output=True, text=True, timeout=30
    )
    
    urls = re.findall(r'https://pbs\.twimg\.com/media/[^\s"\']+', result.stdout)
    
    # 去重
    seen = set()
    unique = []
    for u in urls:
        base = u.split('?')[0]
        if base not in seen:
            seen.add(base)
            unique.append(u)
    
    return unique[:4]  # 最多 4 张


def download_via_browser(img_url: str, save_path: Path, tab_id: str) -> bool:
    """通过浏览器 fetch API 下载图片（thumb 尺寸）"""
    # 转换为 thumb 尺寸（避免 truncated）
    thumb_url = img_url.replace('format=webp', 'format=jpg').replace('name=large', 'name=thumb')
    if 'name=' not in thumb_url:
        thumb_url += '&name=thumb'
    
    js_code = f'''
    (async () => {{
      try {{
        const resp = await fetch('{thumb_url}');
        const blob = await resp.blob();
        return new Promise((resolve) => {{
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        }});
      }} catch(e) {{
        return 'ERROR:' + e.message;
      }}
    }})()
    '''
    
    result = subprocess.run(
        [str(CAMOFOX), 'eval', js_code, tab_id],
        capture_output=True, text=True, timeout=60
    )
    
    output = result.stdout
    
    # 检查错误
    if 'ERROR:' in output:
        return False
    
    # 提取 base64
    b64_match = re.search(r'data:image/[^;]+;base64,([A-Za-z0-9+/=]+)', output)
    if b64_match:
        b64_data = b64_match.group(1)
        try:
            img_data = base64.b64decode(b64_data)
            # 检查文件大小是否合理（thumb 应该 > 1KB）
            if len(img_data) < 1000:
                return False
            with open(save_path, 'wb') as f:
                f.write(img_data)
            return True
        except Exception:
            return False
    
    return False


def get_author_from_markdown(tweet_id: str) -> str:
    """从 markdown 文件获取作者"""
    # 查找 markdown 文件
    for year in ['2026', '2025', '2024']:
        for month in range(12, 0, -1):
            for day in range(31, 0, -1):
                md_path = Path(f'content/prompts/{year}/{month:02d}/{day:02d}/prompt-{tweet_id}.md')
                if md_path.exists():
                    content = md_path.read_text()
                    match = re.search(r'authorLink:.*?x\.com/([^/\s"]+)', content)
                    if match:
                        return match.group(1)
    return 'unknown'


def main():
    print(f"📥 读取评分结果: {SCORED_ITEMS}")
    
    if not SCORED_ITEMS.exists():
        print(f"❌ 文件不存在: {SCORED_ITEMS}")
        sys.exit(1)
    
    with open(SCORED_ITEMS, 'r', encoding='utf-8') as f:
        scored = json.load(f)
    
    # 过滤 >= 55 分
    valid = [item for item in scored if item.get('total', 0) >= 55]
    print(f"📦 通过评分（≥55分）: {len(valid)} 条\n")
    
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
    
    # 打开浏览器标签
    print("🌐 启动浏览器...")
    tab_id = open_browser_tab('https://x.com')
    if not tab_id:
        print("❌ 无法打开浏览器")
        sys.exit(1)
    print(f"   Tab: {tab_id}")
    time.sleep(2)
    
    # 下载图片
    downloaded_count = 0
    total_images = 0
    
    try:
        for item in valid:
            tweet_id = item['id']
            title = item.get('title', '')
            
            # 获取 image_urls
            orig = processed_map.get(tweet_id, {})
            image_urls = orig.get('image_urls', [])
            
            # 如果没有 image_urls，尝试从页面获取
            if not image_urls:
                author = get_author_from_markdown(tweet_id)
                url = f'https://x.com/{author}/status/{tweet_id}'
                print(f"🔍 {tweet_id} - 从页面获取图片 URL...")
                
                navigate_tab(tab_id, url)
                time.sleep(3)
                image_urls = get_image_urls_from_page(tab_id)
            
            if not image_urls:
                print(f"⚠️ {tweet_id} 无图片URL")
                continue
            
            print(f"📸 {tweet_id} - {title}")
            print(f"   下载 {len(image_urls)} 张图片...")
            
            downloaded_images = []
            for i, img_url in enumerate(image_urls[:4]):
                # 命名规则
                if i == 0:
                    filename = f"prompt-{tweet_id}.jpg"
                else:
                    filename = f"prompt-{tweet_id}-{i+1}.jpg"
                
                save_path = IMAGES_DIR / filename
                save_path.parent.mkdir(parents=True, exist_ok=True)
                
                if download_via_browser(img_url, save_path, tab_id):
                    downloaded_images.append(f"/images/prompts/{filename}")
                    total_images += 1
                    print(f"  ✅ {filename}")
                else:
                    print(f"  ❌ {filename} 下载失败")
                
                time.sleep(0.3)  # 避免请求过快
            
            if downloaded_images:
                # 更新 item 的 images 字段
                item['images'] = downloaded_images
                downloaded_count += 1
                print(f"   ✅ 完成 {len(downloaded_images)} 张\n")
            else:
                print(f"   ❌ 全部失败\n")
    
    finally:
        # 关闭浏览器标签
        close_browser_tab(tab_id)
    
    # 保存更新后的数据
    with open(SCORED_ITEMS, 'w', encoding='utf-8') as f:
        json.dump(valid, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"📊 下载完成")
    print(f"  通过评分: {len(valid)} 条")
    print(f"  成功下载: {downloaded_count} 条")
    print(f"  图片总数: {total_images} 张")
    print(f"💾 已更新: {SCORED_ITEMS}")


if __name__ == "__main__":
    main()
