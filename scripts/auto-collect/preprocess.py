#!/usr/bin/env python3
"""
预处理脚本：格式清理 + 数据准备

脚本负责：
- 提取原始prompt（多格式识别）
- 格式清理（@handle、日期、互动数据）
- 模型识别（关键词匹配）
- 去重检查
- 保存清理后的数据供LLM（agent）处理

LLM（agent）负责：
- 标题生成
- 标签提取
- prompt语义清理
- 8维度评分
- 创建markdown文件
"""

import json
import re
import os
import sys
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_DIR, TWEETS_BATCH, PREPROCESSED, PROJECT_ROOT

os.chdir(str(PROJECT_ROOT))

# ====== 模型识别 ======
def identify_model(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in [
        'gpt image 2', 'gpt-image2', 'gpt-image-2', 'gpt image2',
        'chatgpt-image2', 'chatgpt image2', '创建图片', 'generate image',
        'dall-e 3', 'dall-e-3', 'dalle-3'
    ]):
        return 'GPT-Image2'
    if 'midjourney' in text_lower or ' mj ' in text_lower or text_lower.startswith('mj ') or '--ar' in text or '--sref' in text or '--cref' in text:
        return 'Midjourney'
    if 'gemini' in text_lower:
        return 'Gemini'
    if 'dall-e' in text_lower or 'dalle' in text_lower:
        return 'DALL-E'
    if 'stable diffusion' in text_lower or 'sd ' in text_lower:
        return 'Stable Diffusion'
    if 'flux' in text_lower:
        return 'Flux'
    if 'seedream' in text_lower:
        return 'Seedream'
    return '通用 Prompt'

# ====== prompt提取 ======
def extract_raw_prompt(all_text: str, imgs: Optional[List] = None) -> Optional[str]:
    articles = re.findall(r'===ARTICLE \d+===(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
    
    for art in articles:
        if 'SYSTEM PROMPT' in art:
            continue
        
        # 格式1: "提示词：" / "Prompt:"
        patterns_prefix = [
            r'(?:提示词|Prompt)[：:]\s*\n(.+?)(?=\n[A-Z][a-z]+\s+@|\n\d{1,2}:\d{2}\s+[AP]M|\Z)',
            r'【GPT Image2プロンプト】\s*\n(.+?)(?=\n[A-Z][a-z]+\s+@|\n\d{1,2}:\d{2}\s+[AP]M|\Z)',
        ]
        for pattern in patterns_prefix:
            match = re.search(pattern, art, re.DOTALL | re.IGNORECASE)
            if match:
                prompt = match.group(1).strip()
                if len(prompt) > 50:
                    return clean_format(prompt)
        
        # 格式2: 正文中直接包含prompt
        inline_keywords = [
            'input ::', 'step_1', 'Scene_Type', '2x2 grid',
            '国风CG插画', '唐风美学', 'pen and ink drawing',
            'Fine art black and white', '比例：4:3', '主题：用[',
        ]
        if any(kw in art for kw in inline_keywords):
            prompt = extract_inline_prompt(art)
            if prompt and len(prompt) > 50:
                return clean_format(prompt)
    
    # 格式3: 图片ALT text
    if imgs:
        for img in imgs:
            alt = img.get('alt', '') if isinstance(img, dict) else ''
            if len(alt) > 80:
                prompt_indicators = [
                    'illustration', 'portrait', 'landscape', 'scene', 'render',
                    'cinematic', 'detailed', 'style', 'aesthetic', 'composition',
                    'lighting', 'color', 'texture', 'atmosphere', 'mood',
                    'photography', 'camera', 'lens', 'aspect ratio',
                    'ultra', 'highly detailed', 'realistic', 'fantasy',
                    'vintage', 'retro', 'futuristic', 'surreal',
                ]
                alt_lower = alt.lower()
                if any(kw in alt_lower for kw in prompt_indicators):
                    return alt.strip()
    
    return None

def extract_inline_prompt(art_text: str) -> Optional[str]:
    lines = art_text.split('\n')
    prompt_lines = []
    for line in lines:
        if re.match(r'^[A-Z][a-z]+\s+@[^\s]+$', line.strip()):
            if prompt_lines: break
            continue
        if re.match(r'^\d{1,2}:\d{2}\s+(AM|PM)', line.strip()):
            if prompt_lines: break
            continue
        if line.strip() in ['Views', 'Made with AI', 'Made with Gemini']:
            continue
        if re.match(r'^\d+(\.\d+)?[KMB]?$', line.strip()) and len(line.strip()) < 10:
            continue
        if len(line.strip()) > 20:
            prompt_lines.append(line)
    return '\n'.join(prompt_lines).strip() if prompt_lines else None

def clean_format(prompt: str) -> str:
    lines = prompt.split('\n')
    clean_lines = []
    
    for line in lines:
        stripped = line.strip()
        if re.match(r'^[A-Za-z\u4e00-\u9fff]+\s*$', stripped) and len(stripped) < 20:
            continue
        if re.match(r'^@[A-Za-z0-9_]+$', stripped):
            continue
        if re.match(r'^\w+\s+\d{1,2}$', stripped):
            continue
        if re.match(r'^\d{1,2}:\d{2}\s*(AM|PM)', stripped, re.IGNORECASE):
            continue
        if re.match(r'^[\d,.]+[KMB]?$', stripped) and len(stripped) < 10:
            continue
        if stripped in ['Views', 'Made with AI', 'Made with Gemini', 'Show more', '显示更多']:
            continue
        if re.match(r'^提示词\s*Prompt[：:]?\s*$', stripped):
            continue
        if stripped.startswith('@创建图片') or stripped.startswith('@Create image'):
            continue
        clean_lines.append(line)
    
    prompt = '\n'.join(clean_lines)
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    prompt = prompt.strip()
    
    # 截断推文正文边界
    boundary_patterns = [
        r'\n[A-Z][a-z]+\s+[A-Z][a-z]+\s*\n@',
        r'\n[\u4e00-\u9fff]{2,5}\s*\n@',
        r'\n\d+\s*\n\d+\s*\n[\d,.]+[KMB]?\s*$',
    ]
    for pattern in boundary_patterns:
        match = re.search(pattern, prompt)
        if match:
            prompt = prompt[:match.start()].strip()
    
    prompt = re.sub(r'@[A-Za-z0-9_]+', '', prompt)
    prompt = re.sub(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b', '', prompt)
    
    return prompt.strip()

def is_duplicate(tweet_id: str) -> bool:
    """检查推文是否已收录（基于 source 字段，不是 slug）"""
    source_url = f"https://x.com/i/status/{tweet_id}"
    
    try:
        from scripts.supabase_utils import get_prompt_by_tweet_id
        return get_prompt_by_tweet_id(tweet_id) is not None
    except Exception:
        pass
    
    # 降级：检查 markdown 文件的 source 字段
    prompts_dir = Path('content/prompts')
    for md_file in prompts_dir.rglob('*.md'):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        # 检查 source 字段是否匹配（更可靠）
        if source_url in content:
            return True
        # 兼容旧格式：检查 slug
        slug = f"prompt-{tweet_id}"
        if f'slug: "{slug}"' in content or f"slug: '{slug}'" in content or f'slug: {slug}' in content:
            return True
    return False

# ====== 图片下载（过滤后执行） ======
def run_shell(cmd, timeout=30):
    """执行 shell 命令"""
    try:
        return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None

def download_image(tweet_id: str, img_url: str, index: int) -> str:
    """下载单张图片，返回本地路径"""
    # 第一张图作为封面，命名为 prompt-{id}.jpg
    # 后续图片命名为 prompt-{id}-2.jpg, prompt-{id}-3.jpg 等
    if index == 0:
        filename = f"prompt-{tweet_id}.jpg"
    else:
        filename = f"prompt-{tweet_id}-{index+1}.jpg"
    
    local_path = IMAGES_DIR / filename
    
    # 下载图片
    result = run_shell(f'curl -s -L "{img_url}" -o "{local_path}"', timeout=30)
    if result and result.returncode == 0 and local_path.exists():
        # 验证文件是否有效
        if local_path.stat().st_size > 0:
            return f"/images/prompts/{filename}"
    
    # 下载失败，清理
    if local_path.exists():
        local_path.unlink()
    return None

def download_images_for_tweet(tweet_id: str, img_urls: List[str]) -> List[str]:
    """下载一条推文的所有图片"""
    if not img_urls:
        return []
    
    downloaded = []
    for idx, url in enumerate(img_urls):
        path = download_image(tweet_id, url, idx)
        if path:
            downloaded.append(path)
    
    return downloaded

# ====== 主流程 ======
def main():
    print("🔧 预处理：格式清理 + 数据准备")
    print("=" * 60)
    
    batch_file = TWEETS_BATCH
    if not batch_file.exists():
        print("❌ 未找到采集数据")
        return
    
    with open(batch_file, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    
    print(f"📥 读取到 {len(tweets)} 条推文")
    
    # 逐条处理
    preprocessed = []
    skipped_video = 0
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
            continue
        
        # 提取并清理prompt
        raw_prompt = extract_raw_prompt(tweet.get('allText', ''), tweet.get('imgs'))
        if not raw_prompt:
            print(f"⚠️ 未找到prompt: {tweet_id}")
            continue
        
        cleaned_prompt = clean_format(raw_prompt)
        model = identify_model(tweet.get('allText', ''))
        
        # 保存预处理结果，供LLM（agent）处理
        preprocessed.append({
            'tweet_id': tweet_id,
            'author': tweet.get('author', 'Unknown'),
            'authorLink': tweet.get('authorLink', ''),
            'date': tweet.get('date', ''),
            'model': model,
            'prompt': cleaned_prompt,
            'imgs': tweet.get('imgs', []),
            'images': tweet.get('images', []),  # 本地图片路径（batch-fetch-tweets.py 写入）
            'source': f"https://x.com/i/status/{tweet_id}"
        })
        
        print(f"✅ 预处理成功: {tweet_id} ({len(cleaned_prompt)} chars)")
    
    print(f"\n📊 预处理完成: {len(preprocessed)}/{len(tweets)} 条")
    
    # ====== 下载图片（只下载通过过滤的推文） ======
    if preprocessed:
        print(f"\n🖼️  开始下载图片（{len(preprocessed)} 条推文）...")
        for item in preprocessed:
            tweet_id = item['tweet_id']
            img_data = item.get('imgs', [])
            
            if not img_data:
                continue
            
            # 提取图片 URL
            img_urls = []
            for img in img_data:
                if isinstance(img, dict):
                    src = img.get('src', '')
                    if src:
                        img_urls.append(src)
                elif isinstance(img, str):
                    img_urls.append(img)
            
            if img_urls:
                downloaded = download_images_for_tweet(tweet_id, img_urls)
                item['images'] = downloaded
                if downloaded:
                    print(f"  ✅ {tweet_id}: {len(downloaded)} 张图片")
                else:
                    print(f"  ⚠️ {tweet_id}: 无图片下载成功")
    
    # 保存供LLM（agent）处理
    if preprocessed:
        output_file = PREPROCESSED
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(preprocessed, f, ensure_ascii=False, indent=2)
        print(f"\n💾 数据已保存: {output_file}")
        print(f"🤖 请在下一轮用LLM处理这些数据")

if __name__ == "__main__":
    main()