#!/usr/bin/env python3
"""
批量重新分类提示词

规则：根据 tags 和 title 关键词，将 editorial 大杂烩重新分配到精确分类。
同时修复拼音分类（guo-feng → chinese-style, dong-man → anime）。

用法：
  python3 scripts/reclassify-prompts.py          # dry-run，显示变化
  python3 scripts/reclassify-prompts.py --apply  # 实际写入 Supabase
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.supabase_utils import get_client, get_all_prompts

# 分类规则（优先级从高到低）
# 每条规则：(分类, tags关键词列表, title关键词列表)
RULES = [
    # 高优先级：具体类型
    ('product',        ['产品', '包装', '品牌'],                    ['产品', '包装', '品牌', 'LOGO', 'logo', '广告']),
    ('architecture',   ['建筑'],                                    ['建筑', '大楼', '摩天']),
    ('poster',         ['海报'],                                    ['海报']),
    ('illustration',   ['插画'],                                    ['插画', '水彩', '手绘']),
    ('3d',             ['3D渲染', '3D', 'C4D', 'Blender'],          ['3D', '渲染', '建模']),
    ('anime',          ['动漫', '二次元', '漫画'],                   ['动漫', '二次元', '漫画', 'niji', 'Niji']),
    ('chinese-style',  ['国风', '古风', '中国风', '东方'],           ['国风', '古风', '中国风', '东方', '水墨', '山水', '仙侠', '汉服']),
    ('fashion',        ['时尚', '服装', '穿搭'],                     ['时尚', '服装', '穿搭', '高定']),
    ('sci-fi',         ['科幻'],                                    ['科幻', '赛博', '未来', '太空', '星球']),
    ('cyberpunk',      ['赛博朋克'],                                 ['赛博朋克']),
    ('fantasy',        ['奇幻', '魔幻'],                             ['奇幻', '魔幻', '神话', '龙', '精灵']),
    ('retro',          ['复古'],                                    ['复古', '怀旧', '80年代', '90年代']),
    ('minimalist',     ['极简'],                                    ['极简', '简约', '留白']),
    ('abstract',       ['抽象'],                                    ['抽象']),
    ('concept_art',    ['概念'],                                    ['概念艺术', '概念设计']),
    
    # 中优先级：摄影相关
    ('photography',    ['摄影', '电影感', '胶片'],                   ['摄影', '电影', '胶片', '镜头', '拍摄']),
    ('photorealistic', ['写实', '超写实'],                           ['写实', '超写实', '真实感']),
    
    # 低优先级：人物/风景
    ('portrait',       ['人物', '人像', '肖像'],                     ['人像', '肖像', '人物']),
    ('landscape',      ['风景', '自然', '山水'],                     ['风景', '自然', '日落', '日出']),
]

# 拼音分类映射
PINYIN_MAP = {
    'guo-feng': 'chinese-style',
    'dong-man': 'anime',
    'she-ying': 'photography',
}

# 分类名规范化（统一命名）
NORMALIZE_MAP = {
    'concept-art': 'concept_art',
    'commercial': 'product',
    'cinematic': 'photography',
}


def classify(title: str, tags: list, current_category: str) -> str:
    """根据标题和标签判断分类"""
    
    # 先处理拼音分类
    if current_category in PINYIN_MAP:
        return PINYIN_MAP[current_category]
    
    # 规范化分类名
    if current_category in NORMALIZE_MAP:
        return NORMALIZE_MAP[current_category]
    
    # 如果不是 editorial，保持不变（尊重已有分类）
    if current_category != 'editorial':
        return current_category
    
    # 按规则优先级匹配
    tags_str = ' '.join(tags) if tags else ''
    
    for category, tag_keywords, title_keywords in RULES:
        # 检查 tags
        for kw in tag_keywords:
            if kw in tags_str:
                return category
        # 检查 title
        for kw in title_keywords:
            if kw in title:
                return category
    
    # 默认保持 editorial
    return 'editorial'


def main():
    apply_mode = '--apply' in sys.argv
    
    # 获取所有 prompts
    print("📥 获取所有提示词...")
    prompts = get_all_prompts()
    print(f"  共 {len(prompts)} 条")
    
    # 分类统计
    changes = {}  # slug -> (old_category, new_category, title)
    old_counts = {}
    new_counts = {}
    
    for p in prompts:
        old_cat = p.get('category', 'unknown')
        old_counts[old_cat] = old_counts.get(old_cat, 0) + 1
        
        new_cat = classify(p.get('title', ''), p.get('tags', []), old_cat)
        if new_cat != old_cat:
            changes[p['slug']] = (old_cat, new_cat, p.get('title', ''))
        
        new_counts[new_cat] = new_counts.get(new_cat, 0) + 1
    
    print(f"\n📊 分类变化：{len(changes)} 条需要更新")
    print(f"\n旧分类分布：")
    for cat, count in sorted(old_counts.items(), key=lambda x: -x[1]):
        print(f"  {count:4d} | {cat}")
    print(f"\n新分类分布：")
    for cat, count in sorted(new_counts.items(), key=lambda x: -x[1]):
        print(f"  {count:4d} | {cat}")
    
    if not changes:
        print("\n✅ 无需更新")
        return
    
    # 显示变化详情（前30条）
    print(f"\n📝 变化详情（前30条）：")
    for i, (slug, (old_cat, new_cat, title)) in enumerate(list(changes.items())[:30]):
        print(f"  {i+1:2d}. [{old_cat}] → [{new_cat}] | {title[:40]}")
    
    if not apply_mode:
        print(f"\n💡 这是 dry-run 模式。确认后执行：python3 scripts/reclassify-prompts.py --apply")
        return
    
    # 批量更新
    print(f"\n🔄 开始更新 {len(changes)} 条到 Supabase...")
    supabase = get_client()
    updated = 0
    failed = 0
    
    for slug, (old_cat, new_cat, title) in changes.items():
        try:
            result = supabase.table('prompts').update({'category': new_cat}).eq('slug', slug).execute()
            if result.data:
                updated += 1
            else:
                failed += 1
                print(f"  ❌ 失败: {slug}")
        except Exception as e:
            failed += 1
            print(f"  ❌ 异常: {slug} - {e}")
    
    print(f"\n✅ 完成！成功 {updated} 条，失败 {failed} 条")


if __name__ == '__main__':
    main()
