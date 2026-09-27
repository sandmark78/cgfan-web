#!/usr/bin/env python3
"""
处理采集到的推文 — 全自动流程
采集 → 提取 → 评分 → DNA分析 → 部署

复用成熟技能：
- prompt 提取：复用 prompt-extraction-patterns.md 中的多格式提取逻辑
- 模型识别：复用 identify_model() 可信度优先策略
- 评分：8维度关键词评分
- DNA分析：复用 analyze-prompt-dna.py
"""

import json
import subprocess
import sys
import re
import os
from pathlib import Path
from datetime import datetime

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

# ====== 复用技能：模型识别（可信度优先） ======
def identify_model(text):
    """从文本中识别模型，不明确标注则标记为'通用 Prompt'"""
    text_lower = text.lower()
    # GPT-Image2 信号（含中文命令）
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

# ====== 复用技能：多格式 prompt 提取 ======
def extract_clean_prompt(all_text, imgs=None):
    """从完整推文中提取 prompt，支持多种格式（复用 prompt-extraction-patterns.md）
    
    提取优先级：
    1. 正文中的提示词标记（提示词：/ Prompt: 等）
    2. 正文中的内联 prompt（靠特征关键词识别）
    3. 图片 ALT text（很多作者把 prompt 写在图片描述里）
    """
    articles = re.findall(r'===ARTICLE \d+===(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
    
    for art in articles:
        # 跳过系统 prompt
        if 'SYSTEM PROMPT' in art:
            continue
        
        # 格式1: "提示词：" / "Prompt:" / "提示词Prompt：" / 日文 "【GPT Image2プロンプト】"
        patterns_prefix = [
            r'(?:提示词|Prompt)[：:]\s*\n(.+?)(?=\n[A-Z][a-z]+\s+@|\n\d{1,2}:\d{2}\s+[AP]M|\Z)',
            r'【GPT Image2プロンプト】\s*\n(.+?)(?=\n[A-Z][a-z]+\s+@|\n\d{1,2}:\d{2}\s+[AP]M|\Z)',
        ]
        for pattern in patterns_prefix:
            match = re.search(pattern, art, re.DOTALL | re.IGNORECASE)
            if match:
                prompt = match.group(1).strip()
                if len(prompt) > 50:
                    return clean_prompt(prompt)
        
        # 格式2: 正文中直接包含 prompt（无前缀标记）
        inline_keywords = [
            'input ::', 'step_1', 'Scene_Type', '2x2 grid',
            '国风CG插画', '唐风美学', 'pen and ink drawing',
            'Fine art black and white', '比例：4:3', '主题：用[',
        ]
        if any(kw in art for kw in inline_keywords):
            prompt = extract_inline_prompt(art)
            if prompt and len(prompt) > 50:
                return clean_prompt(prompt)
    
    # 格式3: 从图片 ALT text 提取（最后手段）
    if imgs:
        for img in imgs:
            alt = img.get('alt', '') if isinstance(img, dict) else ''
            # ALT text 必须足够长才像是 prompt（不是简单的图片描述）
            if len(alt) > 80:
                # 检查是否包含 prompt 特征词
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
                    print(f"  📸 从图片 ALT text 提取到 prompt ({len(alt)} 字符)")
                    return alt.strip()
    
    return None

def extract_inline_prompt(art_text):
    """提取正文中无标记的 prompt"""
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

def clean_prompt(prompt):
    """清理提取的 prompt — 去除作者信息、推文正文、互动数据"""
    # 移除推文正文中的感性文字（"她只是来试一件衣服..." 这类）
    # 通常在 prompt 末尾，以作者名/日期/互动数据开头
    lines = prompt.split('\n')
    clean_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # 跳过作者信息行（中文名+英文名 或 @handle）
        if re.match(r'^[A-Za-z\u4e00-\u9fff]+\s*$', stripped) and len(stripped) < 20:
            continue
        if re.match(r'^@[A-Za-z0-9_]+$', stripped):
            continue
        
        # 跳过日期时间行
        if re.match(r'^\w+\s+\d{1,2}$', stripped):  # "Jul 31" "Aug 2"
            continue
        if re.match(r'^\d{1,2}:\d{2}\s*(AM|PM)', stripped, re.IGNORECASE):
            continue
        
        # 跳过互动数据行（纯数字如 5, 8, 1.3K）
        if re.match(r'^[\d,.]+[KMB]?$', stripped) and len(stripped) < 10:
            continue
        
        # 跳过常见推文 UI 文字
        if stripped in ['Views', 'Made with AI', 'Made with Gemini', 'Show more', '显示更多', 'View replies', '查看回复', '回复']:
            continue
        
        # 跳过 "提示词Prompt：" 标记行（保留内容，只跳过标记）
        if re.match(r'^提示词\s*Prompt[：:]?\s*$', stripped):
            continue
        
        # 跳过 @创建图片 命令标记（GPT 的中文命令）
        if stripped.startswith('@创建图片') or stripped.startswith('@Create image'):
            continue
        
        clean_lines.append(line)
    
    prompt = '\n'.join(clean_lines)
    
    # 移除末尾的多余空行和空白
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    prompt = prompt.strip()
    
    # 如果 prompt 包含中英文混合，尝试找到真正的 prompt 边界
    # 很多中文作者会在 prompt 后面加推文正文
    # 检测模式：prompt 结束后跟着 "作者名\n@handle\n日期"
    boundary_patterns = [
        r'\n[A-Z][a-z]+\s+[A-Z][a-z]+\s*\n@',  # 英文名+@handle
        r'\n[\u4e00-\u9fff]{2,5}\s*\n@',  # 中文名+@handle
        r'\n\d+\s*\n\d+\s*\n[\d,.]+[KMB]?\s*$',  # 互动数据 5\n8\n1.3K
    ]
    for pattern in boundary_patterns:
        match = re.search(pattern, prompt)
        if match:
            prompt = prompt[:match.start()].strip()
    
    # 最终清理：移除所有残留的 @handle
    prompt = re.sub(r'@[A-Za-z0-9_]+', '', prompt)
    
    # 移除所有残留的日期格式
    prompt = re.sub(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b', '', prompt)
    
    return prompt.strip()

# ====== 去重检查（基于 source URL，不是 slug） ======
def is_duplicate(tweet_id):
    """检查推文是否已收录（基于 source URL，不是 slug）"""
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

# ====== 8维度评分 ======
def score_8_dimensions(prompt_text, images):
    """8维度评分"""
    text = prompt_text.lower()
    scores = {
        'composition': 6, 'color': 6, 'lighting': 6, 'detail': 6,
        'creativity': 6, 'technical': 6, 'aesthetic': 6, 'curation': 6
    }
    
    keyword_map = {
        'composition': {
            'symmetry': 2, '对称': 2, 'rule of thirds': 2, '三分法': 2,
            'close-up': 1.5, '特写': 1.5, 'wide angle': 1.5, '广角': 1.5,
            'composition': 2, '构图': 2, 'framing': 1.5, 'balance': 1.5
        },
        'color': {
            'color palette': 2, '色彩': 2, 'muted': 1.5, '柔和': 1.5,
            'vibrant': 1.5, '鲜艳': 1.5, 'pastel': 1.5, '粉彩': 1.5,
            'monochrome': 1.5, '单色': 1.5, 'earth tones': 1.5, '大地色': 1.5
        },
        'lighting': {
            'cinematic lighting': 2.5, '电影光': 2.5, 'dramatic light': 2.5,
            'soft light': 2, '柔光': 2, 'backlight': 2, '背光': 2,
            'volumetric': 2, '体积光': 2, 'natural light': 1.5, '自然光': 1.5
        },
        'detail': {
            'detailed': 2, '细节': 2, 'intricate': 2, '精致': 2,
            'highly detailed': 2.5, 'ultra detailed': 2.5,
            'texture': 1.5, '纹理': 1.5, 'realistic': 1.5, '真实': 1.5
        },
        'creativity': {
            'surreal': 2.5, '超现实': 2.5, 'fantasy': 2, '奇幻': 2,
            'conceptual': 2, '概念': 2, 'unique': 2, '独特': 2,
            'innovative': 2, '创新': 2, 'artistic': 2, '艺术': 2
        },
        'technical': {
            '8k': 2, '4k': 1.5, 'high quality': 2, '高质量': 2,
            'professional': 1.5, '专业': 1.5, 'masterpiece': 2.5, '杰作': 2.5,
            'photorealistic': 2.5, 'hyperrealistic': 2.5
        },
        'aesthetic': {
            'elegant': 2, '优雅': 2, 'beautiful': 1.5, '美丽': 1.5,
            'aesthetic': 2, '美学': 2, 'stylish': 1.5, '时尚': 1.5,
            'moody': 1.5, '情绪': 1.5, 'atmospheric': 2, '氛围': 2
        },
        'curation': {
            'editorial': 2.5, '编辑': 2.5, 'fashion': 2, '时尚': 2,
            'magazine': 2.5, '杂志': 2.5, 'campaign': 2, '广告': 2,
            'commercial': 1.5, '商业': 1.5
        }
    }
    
    for dim, keywords in keyword_map.items():
        for kw, points in keywords.items():
            if kw in text:
                scores[dim] += points
    
    # 图片加分
    if images:
        img_bonus = min(len(images) * 0.5, 2)
        for key in scores:
            scores[key] += img_bonus
    
    # 限制最高分10分
    for key in scores:
        scores[key] = min(scores[key], 10)
    
    total = sum(scores.values()) / 8 * 8  # 80分制
    return scores, total

# ====== 中文标题生成（增强版，避免重复，有画面感） ======
def generate_title(prompt_text, tweet=None):
    """生成有画面感的中文标题（≤20字）
    
    规则：
    - 不用作者名字
    - 用冒号分隔主题和细节
    - 提取核心视觉元素
    - ≤20字
    """
    # 提取核心视觉元素
    elements = []
    
    # 主体对象
    if any(kw in prompt_text for kw in ['人物', '女孩', '少女', '女性', '女子']):
        elements.append('人物')
    elif any(kw in prompt_text for kw in ['建筑', '城市', '地标']):
        elements.append('建筑')
    elif any(kw in prompt_text for kw in ['产品', '瓶', '罐', '包装']):
        elements.append('产品')
    elif any(kw in prompt_text for kw in ['海报', 'poster']):
        elements.append('海报')
    elif any(kw in prompt_text for kw in ['插画', 'illustration']):
        elements.append('插画')
    
    # 风格特征
    if any(kw in prompt_text for kw in ['微缩', 'miniature', 'tiny']):
        elements.append('微缩')
    elif any(kw in prompt_text for kw in ['纸艺', 'paper', '折叠', '剪纸']):
        elements.append('纸艺')
    elif any(kw in prompt_text for kw in ['东方', '古风', '仙侠', '水墨', '唐风']):
        elements.append('东方')
    elif any(kw in prompt_text for kw in ['复古', 'retro', 'vintage']):
        elements.append('复古')
    elif any(kw in prompt_text for kw in ['科幻', '未来', 'cyberpunk']):
        elements.append('科幻')
    
    # 视觉技法
    if any(kw in prompt_text for kw in ['留白', '呼吸', '空间']):
        elements.append('留白')
    elif any(kw in prompt_text for kw in ['光影', '光', 'light', 'shadow']):
        elements.append('光影')
    elif any(kw in prompt_text for kw in ['色彩', 'color', '撞色']):
        elements.append('色彩')
    elif any(kw in prompt_text for kw in ['质感', 'texture', '纹理']):
        elements.append('质感')
    
    # 组合标题
    if len(elements) >= 2:
        return f"{elements[0]}×{elements[1]}：{elements[2] if len(elements) > 2 else '视觉实验'}"
    elif len(elements) == 1:
        return f"{elements[0]}：视觉创作"
    else:
        # 从 prompt 提取前15个字符作为主题
        first_sentence = prompt_text.split('。')[0].split('，')[0][:15]
        return f"{first_sentence}：AI视觉创作"

def get_category(prompt_text, title):
    """确定分类，匹配现有目录结构"""
    text = prompt_text.lower()
    
    if any(kw in text for kw in ['portrait', 'person', 'character', '人像', '角色']):
        return 'portrait'
    if any(kw in text for kw in ['product', 'commercial', 'brand', '产品', '广告']):
        return 'product'
    if any(kw in text for kw in ['3d', 'render', 'blender', 'c4d', 'octane', '渲染']):
        return '3d'
    if any(kw in text for kw in ['illustration', 'drawing', 'painting', '插画', '绘画']):
        return 'illustration'
    if any(kw in text for kw in ['poster', '海报', 'editorial', '编辑']):
        return 'poster'
    if any(kw in text for kw in ['fashion', 'clothing', 'style', '时尚', '服装']):
        return 'fashion'
    if any(kw in text for kw in ['landscape', 'nature', 'scene', '风景', '自然']):
        return 'landscape'
    
    return 'uncategorized'

# ====== 创建 markdown 文件 ======
def create_markdown(tweet, prompt, title, model, scores, total_score, category):
    """创建 markdown 文件，使用中文标题命名"""
    tweet_id = tweet['id']
    author = tweet.get('author', 'Unknown')
    authorLink = tweet.get('authorLink', '')
    date = tweet.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # 生成标签（支持中英文关键词）
    tags = []
    tag_keywords = {
        # 英文 → 中文标签
        'cinematic': '电影感', 'vintage': '复古', 'minimalist': '极简',
        'futuristic': '未来', 'oriental': '东方', 'dramatic': '戏剧性',
        'cyberpunk': '赛博朋克', 'anime': '动漫', 'surreal': '超现实',
        'fantasy': '奇幻', 'watercolor': '水彩', 'ink': '水墨',
        '3d': '3D', 'render': '渲染', 'portrait': '人像',
        'landscape': '风景', 'architecture': '建筑', 'product': '产品',
        'fashion': '时尚', 'poster': '海报', 'illustration': '插画',
        'photorealistic': '超写实', 'realistic': '写实',
        # 中文 → 中文标签（直接匹配）
        '电影感': '电影感', '复古': '复古', '极简': '极简',
        '未来': '未来', '东方': '东方', '戏剧性': '戏剧性',
        '赛博朋克': '赛博朋克', '动漫': '动漫', '超现实': '超现实',
        '奇幻': '奇幻', '水彩': '水彩', '水墨': '水墨',
        '3D': '3D', '渲染': '渲染', '人像': '人像',
        '风景': '风景', '建筑': '建筑', '产品': '产品',
        '时尚': '时尚', '海报': '海报', '插画': '插画',
        '超写实': '超写实', '写实': '写实',
        '古风': '古风', '仙侠': '仙侠', '国风': '国风',
        '新中式': '新中式', '唐风': '唐风', '宋韵': '宋韵',
        '胶片': '胶片', '颗粒': '胶片颗粒',
        '微缩': '微缩', '等距': '等距', '移轴': '移轴',
        '霓虹': '霓虹', '赛博': '赛博',
        '油画': '油画', '素描': '素描', '版画': '版画',
        '浮雕': '浮雕', '剪纸': '剪纸', '折纸': '折纸',
        '粘土': '粘土', '像素': '像素',
        '蒸汽波': '蒸汽波', '低保真': '低保真',
    }
    prompt_lower = prompt.lower()
    for keyword, tag in tag_keywords.items():
        if keyword.lower() in prompt_lower and tag not in tags:
            tags.append(tag)
    # 限制最多 5 个标签
    tags = tags[:5]
    
    content = f"""---
title: "{title}"
slug: "prompt-{tweet_id}"
date: {date}
added: {datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00'}
author: "{author}"
authorLink: "{authorLink}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "{model}"
cover: "/images/prompts/prompt-{tweet_id}.jpg"
source: "https://x.com/i/status/{tweet_id}"
score: {total_score:.0f}/80
composition: {scores['composition']:.1f}/10
color: {scores['color']:.1f}/10
lighting: {scores['lighting']:.1f}/10
detail: {scores['detail']:.1f}/10
creativity: {scores['creativity']:.1f}/10
technical: {scores['technical']:.1f}/10
aesthetic: {scores['aesthetic']:.1f}/10
curation: {scores['curation']:.1f}/10
---

# {title}

**作者**: {author}  
**日期**: {date}  
**评分**: {total_score:.0f}/80

## 8维度评分

- 构图: {scores['composition']:.1f}/10
- 色彩: {scores['color']:.1f}/10
- 光影: {scores['lighting']:.1f}/10
- 细节: {scores['detail']:.1f}/10
- 创意: {scores['creativity']:.1f}/10
- 技术: {scores['technical']:.1f}/10
- 审美: {scores['aesthetic']:.1f}/10
- 策展: {scores['curation']:.1f}/10

## Prompt

```
{prompt}
```

## 图片

![cover](/images/prompts/prompt-{tweet_id}.jpg)
"""
    
    output_dir = Path(f"content/prompts/{category}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 使用 tweet_id 命名（避免中文标题冲突导致覆盖）
    output_path = output_dir / f"prompt-{tweet_id}.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_path

# ====== 主流程 ======
def main():
    print("🔧 开始处理采集到的推文\n")
    
    # 使用 PID 后缀避免竞态条件，同时兼容无 PID 的旧格式
    pid = os.getpid()
    tweets_path = Path(f"/tmp/tweets_batch_{pid}.json")
    if not tweets_path.exists():
        # 兼容旧格式：无 PID 后缀
        alt_path = Path("/tmp/tweets_batch.json")
        if alt_path.exists():
            tweets_path = alt_path
        else:
            print("❌ 未找到采集数据")
            return
    
    with open(tweets_path, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    
    if not tweets:
        print("没有推文需要处理")
        return
    
    print(f"📊 共 {len(tweets)} 条推文待处理\n")
    
    results = {'processed': 0, 'accepted': 0, 'rejected': 0, 'duplicate': 0}
    
    for tweet in tweets:
        tweet_id = tweet['id']
        print(f"\n{'='*60}")
        print(f"处理推文: {tweet_id}")
        print(f"{'='*60}")
        
        try:
            # 去重检查
            if is_duplicate(tweet_id):
                print(f"⏭️  已采集过，跳过")
                results['duplicate'] += 1
                continue
            
            # 提取 prompt（复用成熟技能的多格式提取）
            all_text = tweet.get('allText', '')
            imgs = tweet.get('imgs', [])
            prompt = extract_clean_prompt(all_text, imgs)
            
            if not prompt:
                # 降级：取 ARTICLE 中最长的文本块
                articles = re.findall(r'===ARTICLE \d+===(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
                if articles:
                    prompt = max(articles, key=len).strip()
            
            if not prompt or len(prompt) < 50:
                print("❌ 无法提取prompt或prompt太短")
                results['rejected'] += 1
                continue
            
            print(f"✅ 提取到prompt ({len(prompt)} 字符)")
            
            # 模型识别（复用成熟技能的可信度优先策略）
            model = identify_model(all_text)
            print(f"🤖 模型: {model}")
            
            # 8维度评分
            images = tweet.get('imgs', [])
            scores, total_score = score_8_dimensions(prompt, images)
            print(f"📊 评分: {total_score:.0f}/80")
            print(f"   构图:{scores['composition']:.1f} 色彩:{scores['color']:.1f} 光影:{scores['lighting']:.1f} 细节:{scores['detail']:.1f}")
            print(f"   创意:{scores['creativity']:.1f} 技术:{scores['technical']:.1f} 审美:{scores['aesthetic']:.1f} 策展:{scores['curation']:.1f}")
            
            # 52分以上收录，65分以上加入「最喜欢的图片」表格
            if total_score < 52:
                print(f"⏭️  评分低于58，加入候选清单")
                # 保存候选（即使低分，方便人工筛选）
                from scripts.auto_collect.save_candidate import save_candidate
                save_candidate(tweet, prompt, title, model, scores, total_score, category)
                results['rejected'] += 1
                continue
            
            # 65分以上自动加入 IMAGE_TASTE.md 的「最喜欢的图片」表格
            if total_score >= 65:
                print(f"⭐ 评分≥65，自动加入美学品味记录")
                from scripts.auto_collect.append_taste import append_to_taste
                append_to_taste(tweet, title, model, total_score, category)
            
            # 生成标题
            title = generate_title(prompt, tweet)
            print(f"📝 标题: {title}")
            
            # 确定分类
            category = get_category(prompt, title)
            print(f"📂 分类: {category}")
            
            # 创建 markdown 文件
            md_path = create_markdown(tweet, prompt, title, model, scores, total_score, category)
            print(f"💾 文件: {md_path}")
            
            results['processed'] += 1
            results['accepted'] += 1
        
        except Exception as e:
            print(f"❌ 处理失败: {e}")
            results['rejected'] += 1
            continue
    
    print(f"\n{'='*60}")
    print(f"处理完成")
    print(f"{'='*60}")
    print(f"✅ 已接受: {results['accepted']}")
    print(f"❌ 已拒绝: {results['rejected']}")
    print(f"🔄 已去重: {results['duplicate']}")
    
    if results['accepted'] > 0:
        # Prompt DNA 分析
        print("\n🧬 运行 Prompt DNA 分析...")
        r = subprocess.run(['python3', 'scripts/analyze-prompt-dna.py'], capture_output=True, text=True, timeout=120)
        if r.returncode == 0:
            print("✅ Prompt DNA 分析成功")
        else:
            print(f"⚠️ DNA 分析失败: {r.stderr[:200]}")
        
        # prebuild
        print("\n🔨 运行 prebuild...")
        r = subprocess.run(['npm', 'run', 'prebuild'], capture_output=True, text=True, timeout=120)
        if r.returncode == 0:
            print("✅ prebuild 成功")
        else:
            print(f"❌ prebuild 失败:\n{r.stderr[:300]}")
            return
        
        # 验证文件完整性
        print("\n🔍 验证文件完整性...")
        new_files = list(Path('content/prompts').rglob('prompt-*.md'))
        missing_cover = 0
        for f in new_files[-results['accepted']:]:
            content = f.read_text()
            if 'cover:' not in content:
                print(f"  ⚠️ {f.name} 缺少 cover 字段")
                missing_cover += 1
            if 'source:' not in content:
                print(f"  ⚠️ {f.name} 缺少 source 字段")
        if missing_cover == 0:
            print("  ✅ 所有文件 cover/source 字段完整")
        
        # 提交部署
        print("\n🚀 提交部署...")
        subprocess.run(['git', 'add', '-A'])
        subprocess.run(['git', 'commit', '-m', f'feat: 自动采集 {results["accepted"]} 条提示词 ({datetime.now().strftime("%Y-%m-%d")})'])
        r = subprocess.run(['git', 'push'], capture_output=True, text=True, timeout=30)
        if r.returncode == 0:
            print("✅ 部署成功")
        else:
            print(f"❌ 部署失败:\n{r.stderr[:200]}")

if __name__ == '__main__':
    main()
