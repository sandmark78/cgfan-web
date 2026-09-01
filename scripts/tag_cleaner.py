#!/usr/bin/env python3
"""
标签清理模块

统一标签格式，删除垃圾标签，合并重叠标签
"""

# 需要删除的泛标签（等于没标签）
GENERIC_TAGS = {'AI绘图', '提示词', 'AI', 'AI艺术', 'AI生成', ''}

# 中英文标签映射：英文 → 中文
EN_TO_ZH = {
    'portrait': '人像',
    'editorial': '编辑设计',
    'landscape': '风景',
    '3d': '3D渲染',
    'poster': '海报',
    'poster design': '海报',
    'brand design': '品牌设计',
    'concept art': '概念艺术',
}

# 重叠标签合并：小类 → 大类
OVERLAP_MAP = {
    '3D': '3D渲染',
    '海报设计': '海报',
    '视觉设计': '编辑设计',
    '字体排版': '排版',
}


def clean_tags(tags: list) -> list:
    """
    清理标签列表
    
    1. 删除泛标签
    2. 英文标签转中文
    3. 合并重叠标签
    4. 去重
    
    Args:
        tags: 原始标签列表
    
    Returns:
        清理后的标签列表
    """
    if not tags:
        return []
    
    cleaned = []
    seen = set()
    
    for tag in tags:
        # 1. 删除泛标签
        if tag in GENERIC_TAGS:
            continue
        
        # 2. 英文标签转中文
        tag_lower = tag.lower()
        if tag_lower in EN_TO_ZH:
            tag = EN_TO_ZH[tag_lower]
        
        # 3. 合并重叠标签
        if tag in OVERLAP_MAP:
            tag = OVERLAP_MAP[tag]
        
        # 4. 去重
        if tag not in seen:
            cleaned.append(tag)
            seen.add(tag)
    
    return cleaned


if __name__ == '__main__':
    # 测试
    test_cases = [
        ['AI绘图', '摄影', 'portrait'],
        ['editorial', '编辑设计', '视觉设计'],
        ['3D', '3D渲染', '海报', '海报设计'],
        ['AI', 'AI艺术', 'AI生成', '提示词', ''],
    ]
    
    for tags in test_cases:
        print(f'{tags} → {clean_tags(tags)}')
