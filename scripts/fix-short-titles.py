#!/usr/bin/env python3
"""
修复过短的标题（≤5字符）

根据 prompt 内容生成更有意义的标题
"""

import os
import re
import sys
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
PROMPTS_DIR = os.path.join(WORKDIR, "content/prompts")


def extract_keywords_from_prompt(prompt_text: str) -> str:
    """从 prompt 中提取关键词生成标题"""
    if not prompt_text:
        return ""
    
    # 清理 prompt
    text = prompt_text.strip()
    text = re.sub(r'[#\-*_\[\]\(\)\{\}]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    
    # 提取前200字符分析
    sample = text[:200].lower()
    
    # 关键词映射
    keywords = {
        'portrait': '人像',
        'landscape': '景观',
        'architecture': '建筑',
        'travel': '旅行',
        'poster': '海报',
        'vintage': '复古',
        'cinematic': '电影感',
        'fantasy': '奇幻',
        'miniature': '微缩',
        'food': '美食',
        'fashion': '时尚',
        'editorial': '编辑',
        'product': '产品',
        'illustration': '插画',
        'watercolor': '水彩',
        'film': '胶片',
        'retro': '复古',
        'futuristic': '未来',
        'cyberpunk': '赛博',
        'steampunk': '蒸汽朋克',
        'japanese': '日式',
        'chinese': '中式',
        'korean': '韩式',
        'eastern': '东方',
        'western': '西方',
        'medieval': '中世纪',
        'ancient': '古典',
        'modern': '现代',
        'minimalist': '极简',
        'maximalist': '极繁',
        'surreal': '超现实',
        'dreamy': '梦幻',
        'ethereal': '空灵',
        'moody': '氛围',
        'dramatic': '戏剧',
        'romantic': '浪漫',
        'gothic': '哥特',
        'baroque': '巴洛克',
        'art nouveau': '新艺术',
        'bauhaus': '包豪斯',
        'swiss': '瑞士',
        'grid': '网格',
        'typography': '字体',
        'lettering': '字体',
        'calligraphy': '书法',
        'brush': '笔刷',
        'ink': '水墨',
        'paper': '纸艺',
        'clay': '粘土',
        'ceramic': '陶瓷',
        'glass': '玻璃',
        'metal': '金属',
        'wood': '木质',
        'stone': '石材',
        'concrete': '混凝土',
        'fabric': '织物',
        'silk': '丝绸',
        'cotton': '棉布',
        'leather': '皮革',
        'nature': '自然',
        'forest': '森林',
        'ocean': '海洋',
        'mountain': '山脉',
        'desert': '沙漠',
        'city': '城市',
        'street': '街道',
        'night': '夜景',
        'day': '日间',
        'sunset': '日落',
        'sunrise': '日出',
        'moon': '月光',
        'star': '星空',
        'sky': '天空',
        'cloud': '云',
        'rain': '雨',
        'snow': '雪',
        'wind': '风',
        'fire': '火',
        'water': '水',
        'flower': '花卉',
        'plant': '植物',
        'animal': '动物',
        'bird': '鸟类',
        'fish': '鱼类',
        'insect': '昆虫',
        'mythical': '神话',
        'dragon': '龙',
        'phoenix': '凤凰',
        'goddess': '女神',
        'warrior': '战士',
        'samurai': '武士',
        'ninja': '忍者',
        'geisha': '艺伎',
        'kimono': '和服',
        'hanfu': '汉服',
        'qipao': '旗袍',
        'cheongsam': '旗袍',
    }
    
    found = []
    for key, value in keywords.items():
        if key in sample:
            found.append(value)
    
    # 去重
    found = list(dict.fromkeys(found))
    
    # 取前3个关键词
    return ' · '.join(found[:3])


def generate_title_from_prompt(prompt_text: str, category: str = '') -> str:
    """根据 prompt 生成标题"""
    keywords = extract_keywords_from_prompt(prompt_text)
    
    if keywords:
        # 如果有分类，加上分类前缀
        if category:
            return f"{category} · {keywords}"
        return keywords
    
    # 如果没有关键词，用分类
    if category:
        return f"{category}视觉"
    
    return "视觉作品"


def fix_short_titles():
    """修复所有≤5字符的标题"""
    fixed_count = 0
    
    for root, dirs, files in os.walk(PROMPTS_DIR):
        for filename in files:
            if not filename.endswith('.md'):
                continue
            
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取 frontmatter
            fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not fm_match:
                continue
            
            frontmatter = fm_match.group(1)
            
            # 提取标题
            title_match = re.search(r'title:\s*"([^"]*)"', frontmatter)
            if not title_match:
                continue
            
            title = title_match.group(1).strip()
            
            # 只处理≤5字符的标题
            if len(title) > 5:
                continue
            
            # 提取其他字段
            slug_match = re.search(r'slug:\s*"([^"]*)"', frontmatter)
            category_match = re.search(r'category:\s*"([^"]*)"', frontmatter)
            prompt_match = re.search(r'## Prompt\n\n(.*?)(?=\n---|\Z)', content, re.DOTALL)
            
            slug = slug_match.group(1) if slug_match else ''
            category = category_match.group(1) if category_match else ''
            prompt_text = prompt_match.group(1).strip() if prompt_match else ''
            
            # 生成新标题
            new_title = generate_title_from_prompt(prompt_text, category)
            
            # 替换标题
            new_content = content.replace(f'title: "{title}"', f'title: "{new_title}"')
            
            # 写回文件
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"✅ {slug}: {title} → {new_title}")
            fixed_count += 1
    
    print(f"\n✅ 共修复 {fixed_count} 个标题")


if __name__ == "__main__":
    fix_short_titles()
