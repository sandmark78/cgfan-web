#!/usr/bin/env python3
"""
智能批量更新提示词分类
根据标题和标签关键词自动判断新分类
"""
import os
import re
from pathlib import Path
from collections import defaultdict

# 分类关键词映射（优先级从高到低）
CATEGORY_RULES = [
    # 具体分类优先
    (['海报', 'poster'], 'poster'),
    (['编辑', 'editorial', '杂志', 'magazine'], 'editorial'),
    (['产品', 'product', '商业', 'commercial', '品牌', 'brand'], 'product'),
    (['摄影', 'photography', '照片'], 'photography'),
    (['超写实', 'photorealistic', '真实'], 'photorealistic'),
    (['插画', 'illustration', '手绘'], 'illustration'),
    (['概念', 'concept'], 'concept-art'),
    (['科幻', 'sci-fi', 'cyberpunk', '赛博'], 'sci-fi'),
    (['奇幻', 'fantasy', '魔幻'], 'fantasy'),
    (['复古', 'retro', '怀旧'], 'retro'),
    (['极简', 'minimalist', '简约'], 'minimalist'),
    (['人像', 'portrait', '人物'], 'portrait'),
    (['风景', 'landscape', '自然'], 'landscape'),
    (['3d', '3D', '渲染', 'render'], '3d'),
    (['动漫', 'anime', '二次元'], 'anime'),
    (['抽象', 'abstract'], 'abstract'),
]

def extract_keywords(text):
    """提取文本中的关键词"""
    text = text.lower()
    keywords = []
    for rule_keywords, category in CATEGORY_RULES:
        for keyword in rule_keywords:
            if keyword.lower() in text:
                keywords.append((keyword, category))
                break
    return keywords

def determine_category(title, tags, prompt_preview):
    """根据标题、标签和提示词预览判断分类"""
    # 合并所有文本
    full_text = f"{title} {' '.join(tags)} {prompt_preview}"
    
    # 提取关键词匹配
    matches = extract_keywords(full_text)
    
    if matches:
        # 返回第一个匹配的分类（优先级最高）
        return matches[0][1]
    
    # 默认分类
    return 'editorial'

def update_file_category(filepath, new_category):
    """更新文件的分类"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换 category 行
    new_content = re.sub(
        r'^category:.*$',
        f'category: {new_category}',
        content,
        flags=re.MULTILINE
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

def process_prompts(batch_size=50):
    """批量处理提示词"""
    prompts_dir = Path('content/prompts')
    
    # 统计
    stats = defaultdict(list)
    updates = []
    
    # 遍历所有提示词文件
    for md_file in prompts_dir.rglob('*.md'):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取 frontmatter
        if not content.startswith('---'):
            continue
        
        fm_end = content.find('---', 3)
        if fm_end == -1:
            continue
        
        frontmatter = content[3:fm_end]
        
        # 提取字段
        title_match = re.search(r'^title:\s*(.+)$', frontmatter, re.MULTILINE)
        category_match = re.search(r'^category:\s*(.+)$', frontmatter, re.MULTILINE)
        tags_match = re.search(r'^tags:\s*\n((?:\s*-\s*.+\n)*)', frontmatter, re.MULTILINE)
        prompt_match = re.search(r'^## Prompt\n\n(.+?)(?=\n\n##|\Z)', content, re.DOTALL)
        
        if not all([title_match, category_match]):
            continue
        
        title = title_match.group(1).strip()
        old_category = category_match.group(1).strip()
        
        # 提取标签
        tags = []
        if tags_match:
            tags_text = tags_match.group(1)
            tags = re.findall(r'-\s*(.+)', tags_text)
        
        # 提取提示词预览（前200字符）
        prompt_preview = ''
        if prompt_match:
            prompt_preview = prompt_match.group(1)[:200]
        
        # 判断新分类
        new_category = determine_category(title, tags, prompt_preview)
        
        # 记录
        stats[old_category].append({
            'file': md_file,
            'title': title,
            'old': old_category,
            'new': new_category,
            'changed': old_category != new_category
        })
        
        if old_category != new_category:
            updates.append((md_file, new_category))
    
    # 打印统计
    print("=== 分类统计 ===")
    for old_cat, items in sorted(stats.items()):
        changed = sum(1 for item in items if item['changed'])
        print(f"{old_cat}: {len(items)}条 (需更新: {changed}条)")
    
    print(f"\n总计需更新: {len(updates)}条")
    
    # 分批更新
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i+batch_size]
        print(f"\n处理批次 {i//batch_size + 1}: {len(batch)}条")
        
        for filepath, new_category in batch:
            update_file_category(filepath, new_category)
            print(f"  ✓ {filepath.name}: {new_category}")
    
    print(f"\n✅ 完成！共更新 {len(updates)} 条提示词")

if __name__ == '__main__':
    process_prompts(batch_size=50)
