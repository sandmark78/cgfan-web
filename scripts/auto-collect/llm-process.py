#!/usr/bin/env python3
"""
LLM 处理脚本：提取 prompt、过滤、评分、生成 markdown

流程：
1. 读取 preprocessed.json
2. 对每条数据：
   - 提取干净的 prompt（从 allText 或 imgs[].alt）
   - 过滤不合格内容（私房/COS/纯人像写真、视频）
   - 品味校准评分（8维度）
   - 如果总分 ≥ 60：下载图片、生成 markdown
3. 输出处理报告
"""

import json
import re
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

sys.path.insert(0, str(Path(__file__).parent.parent))
from taste_bonus import calculate_taste_adjustment, apply_adjustment

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import PREPROCESSED, IMAGES_DIR, PROMPTS_DIR

# 兼容旧代码
CONTENT_DIR = PROMPTS_DIR

def extract_prompt_from_text(allText: str) -> Tuple[str, str]:
    """
    从 allText 提取 prompt
    
    Returns:
        (prompt, model): 清理后的 prompt 和识别的模型
    """
    # 清理 allText：删除 ===ARTICLE N=== 标记
    text = re.sub(r'===ARTICLE \d+===\n?', '', allText)
    
    # 识别模型
    model = "通用 Prompt"
    if 'GPT Image 2' in text or 'GPT-Image2' in text or '@创建图片' in text:
        model = "GPT-Image2"
    elif 'Midjourney' in text or 'MJ' in text or '--ar' in text or '--sref' in text:
        model = "Midjourney"
    elif 'Gemini' in text:
        model = "Gemini"
    
    # 尝试从 "提示词：" / "Prompt:" / "Prompt ↓" 后面提取
    prompt_match = re.search(r'(?:提示词(?:Prompt)?|Prompt)[：:]?\s*[↓]?\s*\n+(.+?)(?=\n\n(?:Made with|Views|\d+:\d+)|$)', text, re.DOTALL | re.IGNORECASE)
    if prompt_match:
        prompt = prompt_match.group(1).strip()
        # 清理 prompt
        prompt = clean_prompt(prompt)
        if len(prompt) > 50:
            return prompt, model
    
    # 尝试提取 Midjourney 参数周围的描述
    mj_match = re.search(r'(.+?--ar\s+\d+:\d+.+?)(?=\n\n|$)', text, re.DOTALL)
    if mj_match:
        prompt = mj_match.group(1).strip()
        prompt = clean_prompt(prompt)
        if len(prompt) > 30:
            return prompt, "Midjourney"
    
    # 尝试提取英文 prompt（包含 illustration, portrait 等关键词）
    eng_keywords = ['illustration', 'portrait', 'cinematic', 'photograph', 'painting', 'poster']
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in eng_keywords):
            # 取这一行和后面几行
            prompt_lines = lines[i:i+5]
            prompt = '\n'.join(prompt_lines).strip()
            prompt = clean_prompt(prompt)
            if len(prompt) > 50:
                return prompt, model
    
    return "", model

def extract_prompt_from_alt(imgs: List[Dict]) -> str:
    """从图片 ALT 提取 prompt"""
    for img in imgs:
        alt = img.get('alt', '')
        if len(alt) > 50:
            return clean_prompt(alt)
    return ""

def clean_prompt(prompt: str) -> str:
    """清理 prompt：删除作者名、时间戳、互动数据等"""
    # 删除作者名和 @handle
    prompt = re.sub(r'^[^@\n]*@[^\s]+\n?', '', prompt, flags=re.MULTILINE)
    
    # 删除时间戳
    prompt = re.sub(r'\d{1,2}:\d{2}\s*(?:AM|PM)?\s*·\s*\w+\s+\d+', '', prompt)
    prompt = re.sub(r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+', '', prompt)
    
    # 删除互动数据
    prompt = re.sub(r'\d+\.?\d*[KMB]?\s*Views', '', prompt, flags=re.IGNORECASE)
    prompt = re.sub(r'^\d+\s*$', '', prompt, flags=re.MULTILINE)
    
    # 删除 "Made with AI" 等
    prompt = re.sub(r'Made with (?:AI|ChatGPT|Midjourney)', '', prompt, flags=re.IGNORECASE)
    prompt = re.sub(r'Show more', '', prompt, flags=re.IGNORECASE)
    
    # 删除多余空行
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    
    return prompt.strip()

def should_filter(prompt: str, allText: str) -> Tuple[bool, str]:
    """
    判断是否应该过滤
    
    Returns:
        (should_filter, reason)
    """
    text_lower = (prompt + ' ' + allText).lower()
    
    # 过滤视频
    if 'video' in text_lower or '.mp4' in text_lower or '.mov' in text_lower:
        return True, "视频内容"
    
    # 过滤私房写真
    if '私房' in text_lower or 'boudoir' in text_lower:
        return True, "私房写真"
    
    # 过滤 COS 写真
    if 'cos' in text_lower and ('写真' in text_lower or 'cosplay' in text_lower):
        return True, "COS写真"
    
    # 过滤纯人像写真（不含仙侠/古风/电影感）
    portrait_keywords = ['人像写真', 'portrait photography', 'photo booth', '拍照亭']
    has_portrait = any(kw in text_lower for kw in portrait_keywords)
    has_artistic = any(kw in text_lower for kw in ['仙侠', '古风', '电影感', 'cinematic', 'fantasy', 'wuxia'])
    
    if has_portrait and not has_artistic:
        return True, "纯人像写真"
    
    # 检查是否只有负面提示词
    if 'negative prompt' in text_lower and 'prompt' not in text_lower.replace('negative prompt', ''):
        return True, "只有负面提示词"
    
    # 检查 prompt 是否为空
    if len(prompt.strip()) < 30:
        return True, "无有效 prompt"
    
    return False, ""

def score_prompt(prompt: str, tags: List[str]) -> Dict:
    """
    8维度评分 + 品味校准
    
    Returns:
        dict with scores and total
    """
    # 基础评分（根据 prompt 内容判断）
    base_scores = {
        'composition': 7,
        'color': 7,
        'lighting': 7,
        'detail': 7,
        'creativity': 7,
        'technical': 7,
        'aesthetic': 7,
        'curation': 7
    }
    
    # 根据 prompt 内容调整基础分
    prompt_lower = prompt.lower()
    
    # 东方美学、留白、诗意 → 构图/审美+1
    if any(kw in prompt_lower for kw in ['东方', 'oriental', '留白', '诗意', '水墨']):
        base_scores['composition'] += 1
        base_scores['aesthetic'] += 1
    
    # 微缩、纸艺、工艺感 → 细节/创意+1
    if any(kw in prompt_lower for kw in ['微缩', 'miniature', '纸艺', 'paper', '工艺']):
        base_scores['detail'] += 1
        base_scores['creativity'] += 1
    
    # 复古、胶片、电影感 → 光影/色彩+1
    if any(kw in prompt_lower for kw in ['复古', 'retro', '胶片', 'film', '电影感', 'cinematic']):
        base_scores['lighting'] += 1
        base_scores['color'] += 1
    
    # 编辑设计、排版、字体 → 策展+1
    if any(kw in prompt_lower for kw in ['编辑', 'editorial', '排版', 'typography', '海报', 'poster']):
        base_scores['curation'] += 1
    
    # 旅行、城市、手绘 → 构图/创意+1
    if any(kw in prompt_lower for kw in ['旅行', 'travel', '城市', 'city', '手绘', 'hand-drawn']):
        base_scores['composition'] += 1
        base_scores['creativity'] += 1
    
    # 应用品味校准
    adjustment = calculate_taste_adjustment(prompt, tags)
    final_scores = apply_adjustment(base_scores, adjustment)
    
    # 计算总分
    total = sum(final_scores.values())
    
    return {
        'base_scores': base_scores,
        'adjustment': adjustment,
        'final_scores': final_scores,
        'total': total
    }

def generate_title(prompt: str, author: str = None) -> str:
    """向后兼容的包装函数，实际调用批量生成"""
    titles = generate_titles_batch([prompt])
    return titles[0] if titles else _fallback_title(prompt)

def generate_titles_batch(prompts: list) -> list:
    """批量生成标题，分批处理避免超时
    
    Args:
        prompts: prompt列表
    
    Returns:
        标题列表，顺序与输入对应
    """
    from llm_cleaner import call_llm
    
    if not prompts:
        return []
    
    # 分批处理，每批最多10个
    BATCH_SIZE = 10
    all_titles = []
    
    for i in range(0, len(prompts), BATCH_SIZE):
        batch = prompts[i:i+BATCH_SIZE]
        batch_titles = _generate_batch(batch)
        all_titles.extend(batch_titles)
    
    return all_titles

def _generate_batch(prompts: list) -> list:
    """生成一批标题（最多10个）"""
    from llm_cleaner import call_llm
    
    # 构造批量请求，减少每个prompt字符数
    prompt_items = []
    for i, prompt in enumerate(prompts, 1):
        prompt_items.append(f"【{i}】\n```\n{prompt[:200]}\n```")  # 300→200字符
    
    llm_prompt = f"""你是CGfan网站的标题策展专家。为以下{len(prompts)}个AI提示词各生成一个**有画面感的中文标题**。

## 提示词列表

{chr(10).join(prompt_items)}

## 标题要求

1. **长度**：8-20个中文字
2. **风格**：有画面感、有创意、能吸引点击
3. **内容**：提取prompt的核心视觉元素，不要泛泛而谈
4. **语言**：纯中文，不要英文
5. **禁止**：
   - 不要包含作者名
   - 不要用"实验"、"创作"等泛词
   - 不要简单罗列关键词（如"微缩×纸艺"）
   - 不要翻译英文prompt，要理解内容后重新表达

## 输出格式

按顺序输出标题，每行一个，格式：序号. 标题
例如：
1. 乌龟背着的袜子商店
2. 圆珠笔课本涂鸦重生
3. 仙侠女将的黑金长剑

不要任何解释，不要引号。
"""
    
    try:
        response = call_llm(llm_prompt, max_tokens=500)
        lines = response.strip().split('\n')
        
        # 解析结果
        titles = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # 匹配 "1. 标题" 格式
            import re
            match = re.match(r'^\d+\.\s*(.+)$', line)
            if match:
                title = match.group(1).strip()
                title = title.strip('"\'「」『』【】')
                titles.append(title)
        
        # 补齐或截断到输入数量
        while len(titles) < len(prompts):
            titles.append(_fallback_title(prompts[len(titles)]))
        titles = titles[:len(prompts)]
        
        return titles
    except Exception as e:
        print(f"⚠️ 批量标题生成失败: {e}")
        return [_fallback_title(p) for p in prompts]


def _fallback_title(prompt: str) -> str:
    """fallback标题生成（当LLM失败时）- 提取核心意象"""
    import re
    prompt_clean = re.sub(r'@\w+', '', prompt)
    prompt_clean = re.sub(r'https?://\S+', '', prompt_clean)
    prompt_clean = re.sub(r'#\w+', '', prompt_clean)
    prompt_clean = prompt_clean.strip()
    
    # 优先提取具体主体+动作
    subject_map = [
        (['tortoise', '乌龟', '龟'], '乌龟'),
        (['mice', 'mouse', '老鼠', '小鼠'], '小鼠'),
        (['socks', '袜子'], '袜子'),
        (['lighthouse', '灯塔'], '灯塔'),
        (['batman', '蝙蝠侠'], '蝙蝠侠'),
        (['garden', '花园'], '花园'),
        (['ceramic', '陶瓷'], '陶瓷'),
        (['whale', '鲸鱼'], '鲸鱼'),
        (['dragon', '龙'], '巨龙'),
        (['robot', '机器人'], '机器人'),
        (['portrait', '肖像'], '肖像'),
        (['poster', '海报'], '海报'),
        (['typography', '字体', 'type'], '字体'),
        (['food', '美食'], '美食'),
        (['product', '产品'], '产品'),
        (['city', '城市'], '城市'),
        (['mountain', '山'], '山岳'),
        (['forest', '森林'], '森林'),
        (['ocean', '海洋', 'sea'], '海洋'),
        (['moon', '月亮'], '月亮'),
        (['star', '星星'], '星星'),
        (['fire', '火焰'], '火焰'),
        (['ice', '冰'], '冰'),
        (['glass', '玻璃'], '玻璃'),
        (['paper', '纸张'], '纸张'),
        (['stone', '石头'], '石头'),
        (['crystal', '水晶'], '水晶'),
    ]
    
    prompt_lower = prompt.lower()
    found = []
    for kws, chn in subject_map:
        for kw in kws:
            if re.search(r'\b' + re.escape(kw) + r'\b', prompt_lower):
                found.append(chn)
                break
    
    # 补充风格词
    style_map = [
        (['vintage', 'retro', '复古'], '复古'),
        (['miniature', '微缩'], '微缩'),
        (['oriental', '东方', '古风'], '东方'),
        (['futuristic', '科幻', '未来'], '科幻'),
        (['watercolor', '水彩'], '水彩'),
        (['cinematic', '电影'], '电影感'),
        (['minimalist', '极简'], '极简'),
    ]
    styles = []
    for kws, chn in style_map:
        for kw in kws:
            if kw in prompt_lower:
                styles.append(chn)
                break
    
    # 组合标题
    if found and styles:
        return f"{found[0]}·{styles[0]}"
    elif found:
        return found[0]
    elif styles:
        return f"{styles[0]}视觉"
    else:
        # 中文prompt：提取第一段核心
        segments = re.split(r'[，。！？\n]', prompt_clean)
        for segment in segments:
            segment = segment.strip()
            if 5 <= len(segment) <= 16:
                return segment
        first_part = prompt_clean[:16].strip()
        if len(first_part) >= 5:
            return first_part
    return "视觉创作"

def extract_tags(prompt: str) -> List[str]:
    """提取3-5个精准标签"""
    tags = []
    prompt_lower = prompt.lower()
    
    # 风格标签
    if any(kw in prompt_lower for kw in ['东方', '古风', '仙侠']):
        tags.append('东方美学')
    if any(kw in prompt_lower for kw in ['微缩', 'miniature']):
        tags.append('微缩景观')
    if any(kw in prompt_lower for kw in ['纸艺', 'paper cut']):
        tags.append('纸艺工艺')
    if any(kw in prompt_lower for kw in ['复古', 'retro']):
        tags.append('复古风格')
    if any(kw in prompt_lower for kw in ['电影感', 'cinematic']):
        tags.append('电影感')
    if any(kw in prompt_lower for kw in ['旅行', 'travel']):
        tags.append('旅行海报')
    if any(kw in prompt_lower for kw in ['海报', 'poster']):
        tags.append('海报设计')
    if any(kw in prompt_lower for kw in ['编辑', 'editorial']):
        tags.append('编辑设计')
    
    # 技术标签
    if 'midjourney' in prompt_lower:
        tags.append('Midjourney')
    elif 'gpt' in prompt_lower:
        tags.append('GPT-Image2')
    
    # 确保至少3个标签
    if len(tags) < 3:
        tags.extend(['AI艺术', '视觉创作'])
    
    return tags[:5]

def download_images(image_urls: List[str], tweet_id: str) -> List[str]:
    """下载图片，返回本地路径列表"""
    import subprocess
    
    downloaded = []
    for i, url in enumerate(image_urls):
        # 强制 JPG 格式
        url = url.replace('format=webp', 'format=jpg')
        if 'format=' not in url:
            url += '&format=jpg' if '?' in url else '?format=jpg'
        
        # 命名：第1张 prompt-{id}.jpg，第2张 prompt-{id}-2.jpg
        if i == 0:
            filename = f"prompt-{tweet_id}.jpg"
        else:
            filename = f"prompt-{tweet_id}-{i+1}.jpg"
        
        save_path = IMAGES_DIR / filename
        
        try:
            result = subprocess.run(
                ['curl', '-sL', '-o', str(save_path), url],
                timeout=15, capture_output=True
            )
            
            if result.returncode == 0 and save_path.exists() and save_path.stat().st_size > 0:
                # 检查是否 WebP 伪装
                file_result = subprocess.run(
                    ['file', str(save_path)], capture_output=True, text=True
                )
                if 'WebP' in file_result.stdout and 'JPEG' not in file_result.stdout:
                    subprocess.run(
                        ['sips', '-s', 'format', 'jpeg', str(save_path), '--out', str(save_path)],
                        capture_output=True
                    )
                
                downloaded.append(f"/images/prompts/{filename}")
        except Exception as e:
            print(f"    ❌ 下载失败: {e}")
    
    return downloaded

def create_markdown(item: Dict, prompt: str, model: str, scores: Dict, 
                   title: str, tags: List[str], images: List[str]) -> Path:
    """创建 markdown 文件"""
    tweet_id = item['tweet_id']
    author = item['author']
    author_link = item.get('authorLink', '')
    date = item['date']
    source = item['source']
    
    # 生成 slug
    slug = f"prompt-{tweet_id}"
    
    # 生成 added 时间戳（毫秒级 ISO）
    now = datetime.now()
    added = now.strftime('%Y-%m-%dT%H:%M:%S.') + f"{now.microsecond // 1000:03d}+08:00"
    
    # 生成 summary
    summary = prompt[:150] + '...' if len(prompt) > 150 else prompt
    
    # 确定 category
    category = "通用"
    prompt_lower = prompt.lower()
    if any(kw in prompt_lower for kw in ['东方', '古风', '仙侠']):
        category = "东方美学"
    elif any(kw in prompt_lower for kw in ['微缩', '纸艺']):
        category = "微缩纸艺"
    elif any(kw in prompt_lower for kw in ['旅行', 'travel']):
        category = "旅行海报"
    elif any(kw in prompt_lower for kw in ['海报', 'poster', '编辑']):
        category = "编辑设计"
    
    # 构建 frontmatter
    final_scores = scores['final_scores']
    
    # 构建 images YAML
    images_yaml = ""
    if images:
        images_yaml = "images:\n" + "\n".join([f'  - "{img}"' for img in images])
    else:
        images_yaml = 'images: []'
    
    frontmatter = f"""---
title: "{title}"
slug: "{slug}"
author: "{author}"
authorLink: "{author_link}"
date: {date}
added: "{added}"
model: "{model}"
tags: {json.dumps(tags, ensure_ascii=False)}
category: "{category}"
summary: "{summary}"
source: "{source}"
cover: "{images[0] if images else ''}"
{images_yaml}
score: {scores['total']}
composition: {final_scores['composition']}
color: {final_scores['color']}
lighting: {final_scores['lighting']}
detail: {final_scores['detail']}
creativity: {final_scores['creativity']}
technical: {final_scores['technical']}
aesthetic: {final_scores['aesthetic']}
curation: {final_scores['curation']}
---

## Prompt

{prompt}
"""
    
    # 写入文件（先写到 content/prompts/ 根目录，后续由 archive-by-date.py 归档）
    filename = f"{slug}.md"
    filepath = CONTENT_DIR / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(frontmatter)
    
    return filepath

def validate_author(author: str) -> bool:
    """验证作者名是否有效"""
    if not author or author.strip() == '':
        return False
    # 纯数字 → 无效（X页面结构变化导致的bug）
    if author.strip().isdigit():
        return False
    # 只有1个字符 → 可疑
    if len(author.strip()) <= 1:
        return False
    return True

def refetch_author(tweet_id: str) -> Optional[Dict]:
    """从X页面重新抓取作者信息（curl方式，不依赖camofox）"""
    import subprocess
    url = f"https://x.com/i/status/{tweet_id}"
    
    try:
        result = subprocess.run(
            ['curl', '-s', '-L', '-A', 'Mozilla/5.0', '--connect-timeout', '5', '--max-time', '10', url],
            capture_output=True, text=True, timeout=15
        )
        
        if result.returncode == 0 and result.stdout:
            html = result.stdout
            # 从 og:title 提取: "Author Name (@handle) on X"
            title_match = re.search(r'<meta property="og:title"[^>]*content="([^"]+)"', html)
            if title_match:
                title = title_match.group(1)
                m = re.match(r'^(.+?)\s+\(@(\w+)\)\s+on X', title)
                if m:
                    author_name = m.group(1)
                    author_handle = m.group(2)
                    author_link = f'https://x.com/{author_handle}'
                    
                    if not author_name.isdigit() and len(author_name) > 1:
                        return {
                            'author': author_name,
                            'authorHandle': author_handle,
                            'authorLink': author_link
                        }
    except subprocess.TimeoutExpired:
        print(f"    ⚠️ 重新抓取作者超时: {tweet_id}")
    except Exception as e:
        print(f"    ⚠️ 重新抓取作者失败: {e}")
    
    return None

def main():
    print("🤖 开始 LLM 处理...\n")
    
    # 读取预处理数据
    if not PREPROCESSED.exists():
        print(f"❌ 文件不存在: {PREPROCESSED}")
        sys.exit(1)
    
    with open(PREPROCESSED, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📦 读取到 {len(data)} 条预处理数据\n")
    
    # 🔒 作者验证：检查并修复纯数字作者
    invalid_author_count = 0
    for i, item in enumerate(data):
        author = item.get('author', '')
        if not validate_author(author):
            invalid_author_count += 1
            tweet_id = item.get('tweet_id', '')
            print(f"⚠️ [{i+1}] 作者名异常: '{author}' (tweet: {tweet_id})")
            
            # 尝试重新抓取
            fixed = refetch_author(tweet_id)
            if fixed:
                item['author'] = fixed['author']
                item['authorLink'] = fixed['authorLink']
                print(f"   ✅ 已修复: {fixed['author']} (@{fixed['authorHandle']})")
            else:
                print(f"   ❌ 无法修复，将跳过此条")
    
    if invalid_author_count > 0:
        print(f"\n🔒 作者验证: {invalid_author_count} 条异常，{invalid_author_count - sum(1 for item in data if not validate_author(item.get('author', '')))} 条已修复\n")
    else:
        print("🔒 作者验证: 全部通过 ✅\n")
    
    results = {
        'total': len(data),
        'filtered': 0,
        'low_score': 0,
        'collected': 0,
        'details': []
    }
    
    # 第一阶段：提取 prompt、过滤、评分，收集所有>=52分的条目
    print("\n第一阶段：提取、过滤、评分...")
    qualified_items = []  # 存储通过筛选的条目
    
    for i, item in enumerate(data):
        tweet_id = item['tweet_id']
        author = item['author']
        allText = item['allText']
        imgs = item.get('imgs', [])
        image_urls = item.get('image_urls', [])
        
        print(f"[{i+1}/{len(data)}] {author} ({tweet_id})")
        
        # 1. 提取 prompt
        prompt = extract_prompt_from_alt(imgs)
        if not prompt:
            prompt, model = extract_prompt_from_text(allText)
        else:
            # 识别模型
            model = "通用 Prompt"
            text_lower = allText.lower()
            if 'gpt image 2' in text_lower or 'gpt-image2' in text_lower:
                model = "GPT-Image2"
            elif 'midjourney' in text_lower or '--ar' in text_lower:
                model = "Midjourney"
            elif 'gemini' in text_lower:
                model = "Gemini"
        
        if not prompt:
            print(f"  ❌ 无法提取 prompt，跳过")
            results['filtered'] += 1
            results['details'].append({
                'tweet_id': tweet_id,
                'author': author,
                'status': 'no_prompt'
            })
            continue
        
        # 2. 过滤检查
        skip, reason = should_filter(prompt, allText)
        if skip:
            print(f"  ❌ 过滤：{reason}")
            results['filtered'] += 1
            results['details'].append({
                'tweet_id': tweet_id,
                'author': author,
                'status': 'filtered',
                'reason': reason
            })
            continue
        
        # 3. 提取标签
        tags = extract_tags(prompt)
        
        # 4. 评分
        scores = score_prompt(prompt, tags)
        print(f"  📊 评分：{scores['total']}/80")
        print(f"     基础分：{sum(scores['base_scores'].values())}")
        print(f"     品味调整：{scores['adjustment']}")
        print(f"     最终分：{scores['final_scores']}")
        
        # 5. 检查分数
        if scores['total'] < 52:
            print(f"  ⚠️ 分数 < 52，不收录")
            results['low_score'] += 1
            results['details'].append({
                'tweet_id': tweet_id,
                'author': author,
                'status': 'low_score',
                'score': scores['total']
            })
            continue
        
        # 收集通过筛选的条目
        qualified_items.append({
            'item': item,
            'prompt': prompt,
            'model': model,
            'scores': scores,
            'tags': tags,
            'image_urls': image_urls,
            'tweet_id': tweet_id,
            'author': author
        })
    
    # 第二阶段：批量生成标题
    if qualified_items:
        print(f"\n第二阶段：批量生成 {len(qualified_items)} 个标题...")
        prompts_for_titles = [q['prompt'] for q in qualified_items]
        titles = generate_titles_batch(prompts_for_titles)
        
        # 将标题赋值给对应条目
        for i, q in enumerate(qualified_items):
            q['title'] = titles[i]
            print(f"  {i+1}. {q['tweet_id']}: {titles[i]}")
    
    # 第三阶段：下载图片、创建 markdown
    print(f"\n第三阶段：下载图片、创建 markdown...")
    for q in qualified_items:
        item = q['item']
        prompt = q['prompt']
        model = q['model']
        scores = q['scores']
        title = q['title']
        tags = q['tags']
        image_urls = q['image_urls']
        tweet_id = q['tweet_id']
        author = q['author']
        
        print(f"\n处理 {tweet_id}...")
        
        # 下载图片
        print(f"  📥 下载图片...")
        images = download_images(image_urls, tweet_id)
        print(f"     下载 {len(images)} 张图片")
        
        # 创建 markdown
        filepath = create_markdown(item, prompt, model, scores, title, tags, images)
        print(f"  ✅ 已创建：{filepath.name}")
        
        results['collected'] += 1
        results['details'].append({
            'tweet_id': tweet_id,
            'author': author,
            'status': 'collected',
            'score': scores['total'],
            'title': title,
            'file': filepath.name
        })
    
    # 输出报告
    print("\n" + "="*60)
    print("📊 LLM 处理完成")
    print(f"  总计：{results['total']} 条")
    print(f"  过滤：{results['filtered']} 条")
    print(f"  低分：{results['low_score']} 条")
    print(f"  收录：{results['collected']} 条")
    print("="*60)
    
    # 保存处理报告
    report_path = Path('data/auto-collect/llm-process-report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 报告已保存：{report_path}")

if __name__ == '__main__':
    main()
