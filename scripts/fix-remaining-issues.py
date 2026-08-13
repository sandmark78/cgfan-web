#!/usr/bin/env python3
"""
修复剩余质量问题：
1. 补充缺失的 category 字段
2. 修复质量差的标题
"""

import re
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
prompts_dir = Path(WORKDIR) / "content/prompts"

def infer_category(fm_text, body_text):
    """从标签和内容推断分类"""
    text = (fm_text + ' ' + body_text).lower()
    
    # 优先级规则
    if any(w in text for w in ['poster', '海报', 'typography', '排版']):
        return '海报设计'
    if any(w in text for w in ['portrait', '人像', 'person', '人物', '女性', '男性']):
        return '人像摄影'
    if any(w in text for w in ['architecture', '建筑', 'building', '室内', 'interior', 'exterior']):
        return '建筑空间'
    if any(w in text for w in ['product', '产品', 'packaging', '包装']):
        return '产品设计'
    if any(w in text for w in ['fashion', '时尚', 'clothing', '服装', 'outfit']):
        return '时尚穿搭'
    if any(w in text for w in ['landscape', '风景', 'nature', '自然', 'mountain', 'sea']):
        return '风景自然'
    if any(w in text for w in ['3d', 'render', 'blender', 'octane', 'cgi', '三维']):
        return '3D渲染'
    if any(w in text for w in ['illustration', '插画', 'drawing', '绘画']):
        return '插画艺术'
    if any(w in text for w in ['cinematic', '电影感', 'film', 'movie']):
        return '电影感'
    if any(w in text for w in ['abstract', '抽象', 'geometric', 'pattern']):
        return '抽象艺术'
    if any(w in text for w in ['古风', 'chinese', '东方', '汉服', '国风']):
        return '古风国潮'
    if any(w in text for w in ['cyberpunk', '赛博朋克', 'neon', '霓虹']):
        return '赛博朋克'
    if any(w in text for w in ['sci-fi', '科幻', 'futuristic', 'space']):
        return '科幻未来'
    if any(w in text for w in ['anime', '动漫', 'manga', 'cartoon']):
        return '动漫二次元'
    if any(w in text for w in ['minimalist', '极简', 'clean', 'simple']):
        return '极简主义'
    if any(w in text for w in ['vintage', '复古', 'retro', '怀旧']):
        return '复古怀旧'
    if any(w in text for w in ['surreal', '超现实', 'fantasy', 'dreamlike']):
        return '超现实'
    if any(w in text for w in ['food', '美食', 'dish', 'culinary']):
        return '美食摄影'
    if any(w in text for w in ['animal', '动物', 'cat', 'dog', 'bird']):
        return '动物世界'
    # 默认
    return 'AI创作'

def fix_missing_category():
    """修复缺失的 category 字段"""
    print("🔧 修复缺失的 category 字段...")
    fixed = 0
    
    for md_file in prompts_dir.rglob("prompt-*.md"):
        content = md_file.read_text()
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not fm_match:
            continue
        fm_text = fm_match.group(1)
        
        if 'category:' in fm_text:
            continue
        
        body = content[len(fm_match.group(0)):]
        category = infer_category(fm_text, body)
        
        # 在 cover: 之前插入 category
        if 'cover:' in fm_text:
            new_fm = fm_text.replace('cover:', f'category: "{category}"\ncover:', 1)
        elif 'images:' in fm_text:
            new_fm = fm_text.replace('images:', f'category: "{category}"\nimages:', 1)
        else:
            new_fm = fm_text + f'\ncategory: "{category}"'
        
        new_content = f'---\n{new_fm}\n---{body}'
        md_file.write_text(new_content)
        fixed += 1
        print(f"  ✅ {md_file.name}: 添加 category: {category}")
    
    print(f"✅ 共修复 {fixed} 个缺失的 category 字段\n")

def fix_bad_titles():
    """修复质量差的标题"""
    print("🔧 修复质量差的标题...")
    fixed = 0
    
    bad_titles_map = {
        'prompt-2081181748478562704.md': '暗室贝司手，侧光勾勒的独立音乐人像',
        'prompt-2087467368607854928.md': 'AI视觉实验：多风格视觉探索合集',
    }
    
    for md_file in prompts_dir.rglob("prompt-*.md"):
        if md_file.name not in bad_titles_map:
            continue
        
        content = md_file.read_text()
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not fm_match:
            continue
        fm_text = fm_match.group(1)
        
        title_match = re.search(r'title:\s*["\'](.+?)["\']', fm_text)
        if not title_match:
            continue
        
        old_title = title_match.group(1)
        new_title = bad_titles_map[md_file.name]
        
        # 检查是否已经是坏标题
        bad_patterns = ['AI视觉创作', '创意视觉', '风格海报', '视觉创作']
        if not any(bad in old_title for bad in bad_patterns):
            continue
        
        new_fm = fm_text.replace(f'title: "{old_title}"', f'title: "{new_title}"')
        body = content[len(fm_match.group(0)):]
        new_content = f'---\n{new_fm}\n---{body}'
        md_file.write_text(new_content)
        fixed += 1
        print(f"  ✅ {md_file.name}: '{old_title}' → '{new_title}'")
    
    print(f"✅ 共修复 {fixed} 个质量差的标题\n")

if __name__ == '__main__':
    print("=" * 60)
    print("修复剩余质量问题")
    print("=" * 60)
    print()
    
    fix_missing_category()
    fix_bad_titles()
    
    print("=" * 60)
    print("✅ 所有问题已修复")
    print("=" * 60)
