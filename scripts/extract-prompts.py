#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能提示词数据提取脚本 v3
- 完整提取提示词内容
- 智能识别 AI 模型（从内容中检测）
- 自动判断难度等级
- 提取有效标签（中英文关键词）
- 过滤空内容和占位符
"""

import os
import re
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional

# 模型识别规则（优先级从高到低）
MODEL_PATTERNS = {
    'Gemini': [r'gemini', r'google\s*ai', r'nano\s*banana'],
    'Grok': [r'grok', r'xAI'],
    'Seedream': [r'seedream', r'seed\s*ream'],
    'DALL-E': [r'dall-e', r'dalle', r'openai'],
    'Stable Diffusion': [r'stable\s*diffusion', r'sd\s*xl', r'sdxl', r'comfyui'],
    'Flux': [r'flux', r'black\s*forest'],
    'Ideogram': [r'ideogram'],
    'Leonardo': [r'leonardo'],
    'Adobe Firefly': [r'firefly', r'adobe'],
    'Midjourney': [r'midjourney', r'mj\s*v?\d', r'niji\s*\d', r'/imagine'],
}

# 难度判断规则
DIFFICULTY_KEYWORDS = {
    'advanced': [
        r'参数', r'parameter', r'权重', r'weight', r'cfg',
        r'controlnet', r'ip-adapter', r'workflow', r'复杂',
        r'advanced', r'高级', r'专业', r'expert', r'--ar',
        r'--v', r'--s', r'--c', r'--q', r'--style',
        r'公式', r'formula', r'技巧', r'technique'
    ],
    'intermediate': [
        r'提示词', r'prompt', r'风格', r'style',
        r'方法', r'method', r'教程', r'tutorial',
        r'步骤', r'step'
    ],
    'beginner': [
        r'简单', r'simple', r'基础', r'basic', r'入门',
        r'beginner', r'新手', r'快速', r'quick', r'一键'
    ]
}

# 标签提取关键词（中英文）
TAG_KEYWORDS = {
    '3D渲染': [r'3d', r'3D', r'c4d', r'octane', r'render', r'渲染', r'三维'],
    '国风': [r'国风', r'中国风', r'东方', r'chinese', r'oriental', r'汉服', r'hanfu', r'古风'],
    '赛博朋克': [r'赛博朋克', r'cyberpunk', r'cyber'],
    '写实': [r'写实', r'realistic', r'photorealistic', r'真实', r'照片级'],
    '动漫': [r'动漫', r'anime', r'manga', r'二次元', r'卡通'],
    '油画': [r'油画', r'oil\s*painting', r'classical', r'古典'],
    '摄影': [r'摄影', r'photography', r'photo', r'镜头', r'camera'],
    '抽象': [r'抽象', r'abstract'],
    '人物': [r'人物', r'portrait', r'character', r'角色', r'人像'],
    '风景': [r'风景', r'landscape', r'scenery', r'自然'],
    '建筑': [r'建筑', r'architecture', r'building'],
    '产品': [r'产品', r'product', r'商品', r'商业'],
    '概念艺术': [r'概念', r'concept', r'概念艺术'],
    '科幻': [r'科幻', r'sci-fi', r'science\s*fiction', r'未来', r'futuristic'],
    '奇幻': [r'奇幻', r'fantasy', r'魔幻', r'magical'],
    '恐怖': [r'恐怖', r'horror', r'惊悚'],
    '可爱': [r'可爱', r'cute', r'kawaii', r'萌', r'卡通'],
    '复古': [r'复古', r'retro', r'vintage', r'怀旧'],
    '极简': [r'极简', r'minimal', r'minimalist', r'简约'],
    '超现实': [r'超现实', r'surreal', r'surrealism'],
    '蒸汽朋克': [r'蒸汽朋克', r'steampunk'],
    'AI艺术': [r'ai\s*art', r'ai\s*艺术', r'人工智能'],
    '电影感': [r'电影', r'cinematic', r'cinema', r'film'],
    '分焦镜头': [r'分焦', r'split\s*diopter', r'双焦'],
}


def detect_model(content: str, frontmatter_model: str = '') -> str:
    """从内容中智能识别 AI 模型"""
    content_lower = content.lower()
    
    # 先检查 frontmatter 中的模型
    if frontmatter_model:
        for model, patterns in MODEL_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, frontmatter_model.lower(), re.IGNORECASE):
                    return model
        # 如果 frontmatter 有值但没匹配到，直接使用
        return frontmatter_model
    
    # 从内容中检测（按优先级）
    for model, patterns in MODEL_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return model
    
    return 'Unknown'


def detect_difficulty(content: str) -> str:
    """根据内容复杂度判断难度"""
    content_lower = content.lower()
    
    # 统计各难度关键词出现次数
    scores = {'beginner': 0, 'intermediate': 0, 'advanced': 0}
    
    for difficulty, keywords in DIFFICULTY_KEYWORDS.items():
        for keyword in keywords:
            matches = re.findall(keyword, content_lower, re.IGNORECASE)
            scores[difficulty] += len(matches)
    
    # 根据内容长度调整
    if len(content) > 1000:
        scores['advanced'] += 2
    elif len(content) > 500:
        scores['intermediate'] += 2
    
    # 返回得分最高的难度
    max_difficulty = max(scores, key=lambda k: scores[k])
    
    # 如果得分都很低，默认为 intermediate
    if scores[max_difficulty] == 0:
        return 'intermediate'
    
    return max_difficulty


def extract_tags(content: str, existing_tags: List[str]) -> List[str]:
    """提取有效标签，去除占位符"""
    # 过滤掉"待处理"等占位符
    valid_tags = [tag for tag in existing_tags if tag not in ['待处理', 'todo', 'placeholder']]
    
    # 从内容中提取标签
    content_lower = content.lower()
    extracted_tags = []
    
    for tag, keywords in TAG_KEYWORDS.items():
        for keyword in keywords:
            if re.search(keyword, content_lower, re.IGNORECASE):
                if tag not in valid_tags and tag not in extracted_tags:
                    extracted_tags.append(tag)
                break
    
    # 合并标签，最多保留 5 个
    all_tags = valid_tags + extracted_tags
    return list(dict.fromkeys(all_tags))[:5]  # 去重并限制数量


def clean_prompt(content: str) -> str:
    """清理提示词内容，提取核心部分"""
    if not content or content.strip() in ['Prompt:', '提示词:', '']:
        return ''
    
    # 移除常见的多余文字模式
    patterns_to_remove = [
        r'^(Prompt:|提示词:)\s*',
        r'(复制即用|一键出图|咒语)[：:]\s*',
        r'/imagine\s+prompt:\s*',
    ]
    
    cleaned = content.strip()
    
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.MULTILINE)
    
    return cleaned.strip()


def parse_markdown_file(file_path: Path) -> Optional[Dict[str, Any]]:
    """解析单个 markdown 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 分离 frontmatter 和正文
        if not content.startswith('---'):
            return None
        
        parts = content.split('---', 2)
        if len(parts) < 3:
            return None
        
        frontmatter_str = parts[1]
        body = parts[2]
        
        # 解析 frontmatter
        try:
            frontmatter = yaml.safe_load(frontmatter_str)
        except yaml.YAMLError:
            return None
        
        # 提取各个部分
        sections = {}
        current_section = None
        current_content = []
        
        for line in body.split('\n'):
            if line.startswith('## '):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = line[3:].strip()
                current_content = []
            else:
                current_content.append(line)
        
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        # 提取提示词
        prompt_text = sections.get('Prompt', '')
        negative_prompt = sections.get('Negative Prompt', '')
        
        # 清理提示词
        cleaned_prompt = clean_prompt(prompt_text)
        
        # 如果清理后为空，跳过这个文件
        if not cleaned_prompt:
            return None
        
        # 智能识别模型
        detected_model = detect_model(body, frontmatter.get('model', ''))
        
        # 判断难度
        detected_difficulty = detect_difficulty(body)
        
        # 提取标签
        existing_tags = frontmatter.get('tags', [])
        if isinstance(existing_tags, str):
            existing_tags = [existing_tags]
        extracted_tags = extract_tags(body, existing_tags)
        
        # 提取参数
        parameters = {}
        if 'Parameters' in sections:
            param_text = sections['Parameters']
            for line in param_text.split('\n'):
                if '|' in line and not line.strip().startswith('|---'):
                    parts = [p.strip() for p in line.split('|') if p.strip()]
                    if len(parts) == 2 and parts[0] not in ['Setting', '参数']:
                        parameters[parts[0]] = parts[1]
        
        # 构建数据结构
        result = {
            'title': frontmatter.get('title', ''),
            'slug': frontmatter.get('slug', ''),
            'model': detected_model,
            'category': frontmatter.get('category', 'uncategorized'),
            'tags': extracted_tags,
            'difficulty': detected_difficulty,
            'cover': frontmatter.get('cover', ''),
            'date': str(frontmatter.get('date', '')),
            'source': frontmatter.get('source', ''),
            'author': frontmatter.get('author', 'Unknown'),
            'prompt': cleaned_prompt,
            'negativePrompt': negative_prompt if negative_prompt and negative_prompt != '(none provided)' else '',
            'parameters': parameters
        }
        
        return result
    except Exception as e:
        print(f"❌ 处理失败 {file_path.name}: {e}")
        return None


def main():
    """主函数"""
    content_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')
    output_file = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/lib/prompts-data.json')
    
    all_prompts = []
    error_count = 0
    skipped_count = 0
    
    # 遍历所有 markdown 文件
    for md_file in content_dir.rglob('*.md'):
        prompt_data = parse_markdown_file(md_file)
        if prompt_data:
            all_prompts.append(prompt_data)
        else:
            skipped_count += 1
    
    # 按日期排序（最新的在前）
    all_prompts.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    # 写入 JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_prompts, f, ensure_ascii=False, indent=2)
    
    # 统计信息
    model_stats = {}
    difficulty_stats = {}
    
    for prompt in all_prompts:
        model = prompt.get('model', 'Unknown')
        difficulty = prompt.get('difficulty', 'Unknown')
        
        model_stats[model] = model_stats.get(model, 0) + 1
        difficulty_stats[difficulty] = difficulty_stats.get(difficulty, 0) + 1
    
    print("\n" + "="*60)
    print("✅ 数据提取完成！")
    print("="*60)
    print(f"📊 总计: {len(all_prompts)} 条提示词")
    print(f"⚠️  跳过: {skipped_count} 个文件（空内容或格式错误）")
    print("\n🤖 模型分布:")
    for model, count in sorted(model_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"   {model}: {count}")
    print("\n📈 难度分布:")
    for difficulty, count in sorted(difficulty_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"   {difficulty}: {count}")
    print("="*60)


if __name__ == '__main__':
    main()
