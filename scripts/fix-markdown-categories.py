#!/usr/bin/env python3
"""
批量修复 markdown 文件的 category 字段
将 editorial 大杂烩重新分类到精确分类
"""

import os
import re
from pathlib import Path

# 分类规则（和 reclassify-prompts.py 一致）
RULES = [
    ('product', ['产品', '包装', '品牌'], ['产品', '包装', '品牌', 'LOGO', 'logo', '广告']),
    ('architecture', ['建筑'], ['建筑', '大楼', '摩天']),
    ('poster', ['海报'], ['海报']),
    ('illustration', ['插画'], ['插画', '水彩', '手绘']),
    ('3d', ['3D渲染', '3D', 'C4D', 'Blender'], ['3D', '渲染', '建模']),
    ('anime', ['动漫', '二次元', '漫画'], ['动漫', '二次元', '漫画', 'niji', 'Niji']),
    ('chinese-style', ['国风', '古风', '中国风', '东方'], ['国风', '古风', '中国风', '东方', '水墨', '山水', '仙侠', '汉服']),
    ('fashion', ['时尚', '服装', '穿搭'], ['时尚', '服装', '穿搭', '高定']),
    ('sci-fi', ['科幻'], ['科幻', '赛博', '未来', '太空', '星球']),
    ('cyberpunk', ['赛博朋克'], ['赛博朋克']),
    ('fantasy', ['奇幻', '魔幻'], ['奇幻', '魔幻', '神话', '龙', '精灵']),
    ('retro', ['复古'], ['复古', '怀旧', '80年代', '90年代']),
    ('minimalist', ['极简'], ['极简', '简约', '留白']),
    ('abstract', ['抽象'], ['抽象']),
    ('concept_art', ['概念'], ['概念艺术', '概念设计']),
    ('photography', ['摄影', '电影感', '胶片'], ['摄影', '电影', '胶片', '镜头', '拍摄']),
    ('photorealistic', ['写实', '超写实'], ['写实', '超写实', '真实感']),
    ('portrait', ['人物', '人像', '肖像'], ['人像', '肖像', '人物']),
    ('landscape', ['风景', '自然', '山水'], ['风景', '自然', '日落', '日出']),
]

def classify(title, tags, current_category):
    """根据标题和标签判断分类"""
    if current_category != 'editorial':
        return current_category
    
    tags_str = ' '.join(tags) if tags else ''
    
    for category, tag_keywords, title_keywords in RULES:
        for kw in tag_keywords:
            if kw in tags_str:
                return category
        for kw in title_keywords:
            if kw in title:
                return category
    
    return 'editorial'

def extract_frontmatter(content):
    """提取 frontmatter"""
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not match:
        return None, content
    
    fm_text = match.group(1)
    body = content[match.end():]
    
    # 解析 frontmatter
    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            # 处理数组
            if value.startswith('[') and value.endswith(']'):
                value = [v.strip().strip('"\'') for v in value[1:-1].split(',') if v.strip()]
            fm[key] = value
    
    return fm, body

def update_frontmatter(fm, body):
    """重新生成 frontmatter"""
    lines = ['---']
    for key, value in fm.items():
        if isinstance(value, list):
            items = ', '.join(f'"{v}"' for v in value)
            lines.append(f'{key}: [{items}]')
        else:
            lines.append(f'{key}: {value}')
    lines.append('---')
    lines.append('')
    return '\n'.join(lines) + '\n' + body

def main():
    content_dir = Path('content/prompts')
    updated = 0
    total = 0
    
    for md_file in content_dir.rglob('*.md'):
        total += 1
        content = md_file.read_text(encoding='utf-8')
        
        fm, body = extract_frontmatter(content)
        if not fm:
            continue
        
        old_category = fm.get('category', 'editorial')
        title = fm.get('title', '')
        tags = fm.get('tags', [])
        
        new_category = classify(title, tags, old_category)
        
        if new_category != old_category:
            fm['category'] = new_category
            new_content = update_frontmatter(fm, body)
            md_file.write_text(new_content, encoding='utf-8')
            updated += 1
            print(f'[{old_category}] → [{new_category}] {md_file.name}')
    
    print(f'\n✅ 完成！更新 {updated}/{total} 个文件')

if __name__ == '__main__':
    main()
