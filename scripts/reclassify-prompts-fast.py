#!/usr/bin/env python3
"""
批量重新分类提示词（高效版）
使用 Supabase 批量更新，而不是逐条更新
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.supabase_utils import get_client

# 分类规则（优先级从高到低）
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

PINYIN_MAP = {
    'guo-feng': 'chinese-style',
    'dong-man': 'anime',
    'she-ying': 'photography',
}

NORMALIZE_MAP = {
    'concept-art': 'concept_art',
    'commercial': 'product',
    'cinematic': 'photography',
}


def classify(title: str, tags: list, current_category: str) -> str:
    if current_category in PINYIN_MAP:
        return PINYIN_MAP[current_category]
    if current_category in NORMALIZE_MAP:
        return NORMALIZE_MAP[current_category]
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


def main():
    from scripts.supabase_utils import get_all_prompts
    
    print("📥 获取所有提示词...")
    prompts = get_all_prompts()
    print(f"  共 {len(prompts)} 条")
    
    # 按新分类分组
    updates_by_category = {}
    for p in prompts:
        old_cat = p.get('category', 'unknown')
        new_cat = classify(p.get('title', ''), p.get('tags', []), old_cat)
        if new_cat != old_cat:
            if new_cat not in updates_by_category:
                updates_by_category[new_cat] = []
            updates_by_category[new_cat].append(p['slug'])
    
    print(f"\n📊 需要更新 {sum(len(v) for v in updates_by_category.values())} 条")
    for cat, slugs in sorted(updates_by_category.items()):
        print(f"  → {cat}: {len(slugs)} 条")
    
    if '--apply' not in sys.argv:
        print(f"\n💡 dry-run 模式。加 --apply 执行更新")
        return
    
    # 批量更新（按分类分组，每组一次请求）
    client = get_client()
    total_updated = 0
    
    for new_cat, slugs in updates_by_category.items():
        print(f"\n🔄 更新 {len(slugs)} 条到 {new_cat}...")
        try:
            # 使用 in 过滤批量更新
            result = client.table('prompts').update({'category': new_cat}).in_('slug', slugs).execute()
            count = len(result.data) if result.data else 0
            total_updated += count
            print(f"  ✅ 成功 {count} 条")
        except Exception as e:
            print(f"  ❌ 失败: {e}")
    
    print(f"\n✅ 完成！共更新 {total_updated} 条")


if __name__ == '__main__':
    main()
