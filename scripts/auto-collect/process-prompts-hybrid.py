#!/usr/bin/env python3
"""
混合处理流程：脚本格式清理 + LLM语义处理

脚本负责：
- 提取原始prompt（多格式识别）
- 格式清理（@handle、日期、互动数据）
- 模型识别（关键词匹配）
- 去重检查
- 文件结构验证

LLM负责（通过API调用）：
- 标题生成（有画面感的中文标题）
- 标签提取（语义理解，3-5个精准标签）
- prompt语义清理（识别真正的prompt vs 作者感言）
- 8维度评分（构图/色彩/光影/细节/创意/技术/审美/策展）

使用方式：
1. 脚本先做格式清理，生成临时文件
2. 调用LLM API处理临时文件
3. LLM返回结果后，脚本生成最终markdown
"""

import json
import re
import os
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

# ====== 配置 ======
LLM_API_URL = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# ====== 脚本部分：格式清理 ======

def identify_model(text: str) -> str:
    """模型识别（关键词匹配，可信度优先）"""
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

def extract_raw_prompt(all_text: str, imgs: Optional[List] = None) -> Optional[str]:
    """提取原始prompt（多格式识别）"""
    articles = re.findall(r'===ARTICLE \d+===(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
    
    for art in articles:
        if 'SYSTEM PROMPT' in art:
            continue
        
        # 格式1: "提示词：" / "Prompt:" / "提示词Prompt："
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
        
        # 格式2: 正文中直接包含prompt（无前缀标记）
        inline_keywords = [
            'input ::', 'step_1', 'Scene_Type', '2x2 grid',
            '国风CG插画', '唐风美学', 'pen and ink drawing',
            'Fine art black and white', '比例：4:3', '主题：用[',
        ]
        if any(kw in art for kw in inline_keywords):
            prompt = extract_inline_prompt(art)
            if prompt and len(prompt) > 50:
                return clean_format(prompt)
    
    # 格式3: 从图片ALT text提取
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
    """提取正文中无标记的prompt"""
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
    """格式清理（@handle、日期、互动数据）"""
    lines = prompt.split('\n')
    clean_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # 跳过作者信息行
        if re.match(r'^[A-Za-z\u4e00-\u9fff]+\s*$', stripped) and len(stripped) < 20:
            continue
        if re.match(r'^@[A-Za-z0-9_]+$', stripped):
            continue
        
        # 跳过日期时间行
        if re.match(r'^\w+\s+\d{1,2}$', stripped):
            continue
        if re.match(r'^\d{1,2}:\d{2}\s*(AM|PM)', stripped, re.IGNORECASE):
            continue
        
        # 跳过互动数据行
        if re.match(r'^[\d,.]+[KMB]?$', stripped) and len(stripped) < 10:
            continue
        
        # 跳过常见UI文字
        if stripped in ['Views', 'Made with AI', 'Made with Gemini', 'Show more', '显示更多', 'View replies', '查看回复', '回复']:
            continue
        
        # 跳过标记行
        if re.match(r'^提示词\s*Prompt[：:]?\s*$', stripped):
            continue
        if stripped.startswith('@创建图片') or stripped.startswith('@Create image'):
            continue
        
        clean_lines.append(line)
    
    prompt = '\n'.join(clean_lines)
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    prompt = prompt.strip()
    
    # 检测并截断推文正文边界
    boundary_patterns = [
        r'\n[A-Z][a-z]+\s+[A-Z][a-z]+\s*\n@',
        r'\n[\u4e00-\u9fff]{2,5}\s*\n@',
        r'\n\d+\s*\n\d+\s*\n[\d,.]+[KMB]?\s*$',
    ]
    for pattern in boundary_patterns:
        match = re.search(pattern, prompt)
        if match:
            prompt = prompt[:match.start()].strip()
    
    # 移除残留的@handle和日期
    prompt = re.sub(r'@[A-Za-z0-9_]+', '', prompt)
    prompt = re.sub(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b', '', prompt)
    
    return prompt.strip()

def is_duplicate(tweet_id: str) -> bool:
    """去重检查（基于slug）"""
    slug = f"prompt-{tweet_id}"
    prompts_dir = Path('content/prompts')
    for md_file in prompts_dir.rglob('*.md'):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if f'slug: "{slug}"' in content or f"slug: '{slug}'" in content:
            return True
        if f'slug: {slug}' in content:
            return True
    
    data_file = Path('lib/prompts-data.ts')
    if data_file.exists():
        content = data_file.read_text()
        if slug in content:
            return True
    
    return False

# ====== LLM部分：语义处理 ======

def call_llm_for_processing(prompt_text: str, tweet_info: Dict) -> Dict:
    """调用LLM进行语义处理"""
    
    system_prompt = """你是CGfan网站的内容处理助手。你的任务是对AI生成的图像prompt进行专业处理。

你需要完成以下任务：
1. 生成有画面感的中文标题（≤20字，体现具体内容，不要"AI视觉创作"这种泛称）
2. 提取3-5个精准标签（从prompt中提取核心元素）
3. 对prompt进行语义清理（识别真正的prompt vs 作者感言/推文正文）
4. 8维度评分（构图/色彩/光影/细节/创意/技术/审美/策展，每维度1-10分）

输出格式（JSON）：
{
  "title": "中文标题",
  "tags": ["标签1", "标签2", "标签3"],
  "cleaned_prompt": "清理后的prompt",
  "scores": {
    "composition": 8,
    "color": 8,
    "lighting": 8,
    "detail": 8,
    "creativity": 8,
    "technical": 8,
    "aesthetic": 8,
    "curation": 8
  }
}"""

    user_prompt = f"""请处理以下AI图像prompt：

**推文信息**：
- 作者：{tweet_info.get('author', 'Unknown')}
- 日期：{tweet_info.get('date', 'Unknown')}
- 模型：{tweet_info.get('model', '通用 Prompt')}

**原始prompt**：
{prompt_text}

请按照要求输出JSON格式的结果。"""

    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    try:
        response = requests.post(LLM_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # 提取JSON
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            return json.loads(json_match.group())
        else:
            print(f"⚠️ LLM返回格式错误: {content[:200]}")
            return None
    except Exception as e:
        print(f"❌ LLM调用失败: {e}")
        return None

# ====== 主流程 ======

def process_tweet(tweet: Dict) -> Optional[Dict]:
    """处理单条推文"""
    tweet_id = tweet['id']
    
    # 去重检查
    if is_duplicate(tweet_id):
        print(f"⏭️ 跳过重复: {tweet_id}")
        return None
    
    # 提取原始prompt
    raw_prompt = extract_raw_prompt(tweet.get('allText', ''), tweet.get('imgs'))
    if not raw_prompt:
        print(f"⚠️ 未找到prompt: {tweet_id}")
        return None
    
    # 格式清理
    cleaned_prompt = clean_format(raw_prompt)
    
    # 模型识别
    model = identify_model(tweet.get('allText', ''))
    
    # 调用LLM进行语义处理
    tweet_info = {
        'author': tweet.get('author', 'Unknown'),
        'date': tweet.get('date', ''),
        'model': model
    }
    
    llm_result = call_llm_for_processing(cleaned_prompt, tweet_info)
    if not llm_result:
        print(f"❌ LLM处理失败: {tweet_id}")
        return None
    
    # 计算总分
    scores = llm_result.get('scores', {})
    total_score = sum(scores.values())
    
    # 过滤低分
    if total_score < 65:
        print(f"⏭️ 评分过低({total_score}/80): {tweet_id}")
        return None
    
    # 构建结果
    result = {
        'tweet_id': tweet_id,
        'title': llm_result.get('title', ''),
        'tags': llm_result.get('tags', []),
        'prompt': llm_result.get('cleaned_prompt', cleaned_prompt),
        'model': model,
        'author': tweet.get('author', 'Unknown'),
        'date': tweet.get('date', ''),
        'scores': scores,
        'total_score': total_score,
        'imgs': tweet.get('imgs', [])
    }
    
    return result

def main():
    """主流程"""
    print("🤖 混合处理流程：脚本格式清理 + LLM语义处理")
    print("=" * 60)
    
    # 读取采集数据
    batch_file = Path('/tmp/tweets_batch.json')
    if not batch_file.exists():
        print("❌ 未找到采集数据")
        return
    
    with open(batch_file, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    
    print(f"📥 读取到 {len(tweets)} 条推文")
    
    # 逐条处理
    results = []
    for tweet in tweets:
        result = process_tweet(tweet)
        if result:
            results.append(result)
            print(f"✅ 处理成功: {result['title']} ({result['total_score']}/80)")
    
    print(f"\n📊 处理完成: {len(results)}/{len(tweets)} 条通过")
    
    # 保存结果
    if results:
        output_file = Path('/tmp/llm_processed.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"💾 结果已保存: {output_file}")

if __name__ == "__main__":
    main()
