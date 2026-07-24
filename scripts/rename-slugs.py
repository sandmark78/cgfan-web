#!/usr/bin/env python3
"""
批量重命名机器slug为可读格式
策略：从标题提取关键词，生成英文slug
"""

import os
import re
import unicodedata
from pathlib import Path
from collections import defaultdict

# 中文转拼音映射（简化版）
PINYIN_MAP = {
    '微缩': 'miniature', '城市': 'city', '玻璃': 'glass', '瓶': 'bottle',
    '沙漠': 'desert', '香水': 'perfume', '海报': 'poster', '复古': 'vintage',
    '户外': 'outdoor', '杂志': 'magazine', '动漫': 'anime', '水墨': 'ink',
    '角色': 'character', '胶囊': 'capsule', '玩具': 'toy', '宇航员': 'astronaut',
    '宇宙': 'cosmic', '故事书': 'storybook', '雪佛兰': 'chevrolet', '卡玛洛': 'camaro',
    '性能': 'performance', '韩国': 'korean', '女性': 'woman', '雨天': 'rainy',
    '街拍': 'street', '东方': 'oriental', '古典': 'classical', '水中': 'underwater',
    '人像': 'portrait', '梦幻': 'dreamy', '柔光': 'softlight', '龙': 'dragon',
    '少女': 'girl', '中国风': 'chinese', '奢华': 'luxury', '编辑': 'editorial',
    '大片': 'editorial', '未来': 'futuristic', '战甲': 'armor', '时装': 'fashion',
    '拼贴': 'collage', '艺术': 'art', '旅行': 'travel', '高级': 'premium',
    '矢量': 'vector', '景观': 'landscape', '剪影': 'silhouette', '扁平': 'flat',
    '教堂': 'cathedral', '芭蕾': 'ballet', '舞者': 'dancer', '背光': 'backlight',
    '神圣': 'sacred', '水彩': 'watercolor', '故事': 'story', '插画': 'illustration',
    '咖啡': 'coffee', '商业': 'commercial', '产品': 'product', '爆炸': 'explosion',
    '摄影': 'photography', '城市骑行': 'city-cycling', '排版': 'typography',
    '角色设定': 'character-design', '手账': 'journal', '编辑照片': 'editorial-photo',
    '网格': 'grid', '极简': 'minimalist', '工作室': 'studio', '亚洲': 'asian',
    '咖啡馆': 'cafe', '日韩': 'japanese-korean', '提示词': 'prompt',
}

def slugify(text):
    """将文本转换为URL友好的slug"""
    # 替换中文为英文
    for cn, en in PINYIN_MAP.items():
        text = text.replace(cn, en)
    
    # 移除特殊字符，保留字母数字和连字符
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[-\s]+', '-', text)
    text = text.strip('-')
    
    # 限制长度
    if len(text) > 50:
        text = text[:50].rstrip('-')
    
    return text or 'untitled'

def extract_keywords(title, max_words=3):
    """从标题提取关键词"""
    # 移除常见停用词
    stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些', '什么', '怎么', '如何', '为什么', '哪', '谁', '多少', '几', '怎样', '吗', '呢', '吧', '啊', '呀', '哦', '嗯', '哈', '哎', '唉', '喂', '嘿', '哼', '哼', '哼'}
    
    # 提取中文词组
    words = re.findall(r'[\u4e00-\u9fa5]{2,4}', title)
    filtered = [w for w in words if w not in stop_words][:max_words]
    
    return '-'.join(filtered) if filtered else ''

def generate_slug(title, existing_slugs):
    """生成唯一的slug"""
    base_slug = slugify(title)
    
    # 如果slug已存在，添加数字后缀
    counter = 1
    slug = base_slug
    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug

def process_file(filepath):
    """处理单个文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取标题
    title_match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    if not title_match:
        return None
    
    title = title_match.group(1)
    
    # 提取当前slug
    slug_match = re.search(r'^slug:\s*(.+?)\s*$', content, re.MULTILINE)
    current_slug = slug_match.group(1) if slug_match else None
    
    # 生成新slug
    keywords = extract_keywords(title)
    if keywords:
        new_slug = keywords
    else:
        new_slug = slugify(title)
    
    return {
        'file': filepath,
        'title': title,
        'current_slug': current_slug,
        'new_slug': new_slug
    }

def main():
    prompts_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')
    
    # 收集所有需要重命名的文件
    files_to_rename = []
    existing_slugs = set()
    
    for md_file in prompts_dir.rglob('*.md'):
        filename = md_file.name
        
        # 检查是否是机器slug
        if re.match(r'^prompt-\d{10,}\.md$', filename) or re.match(r'^-\d{10,}\.md$', filename):
            result = process_file(md_file)
            if result:
                files_to_rename.append(result)
                existing_slugs.add(result['new_slug'])
    
    print(f'发现 {len(files_to_rename)} 个需要重命名的文件')
    
    # 生成重命名映射
    rename_map = []
    for item in files_to_rename:
        old_path = item['file']
        new_filename = f"{item['new_slug']}.md"
        new_path = old_path.parent / new_filename
        
        # 避免重复
        counter = 1
        while new_path.exists():
            new_filename = f"{item['new_slug']}-{counter}.md"
            new_path = old_path.parent / new_filename
            counter += 1
        
        rename_map.append({
            'old': old_path,
            'new': new_path,
            'old_slug': item['current_slug'],
            'new_slug': item['new_slug'],
            'title': item['title'][:50]
        })
    
    # 输出预览
    print('\n重命名预览（前10个）：')
    for item in rename_map[:10]:
        print(f"  {item['old'].name} → {item['new'].name}")
        print(f"    标题: {item['title']}")
    
    # 执行重命名
    print(f'\n开始重命名 {len(rename_map)} 个文件...')
    renamed = 0
    for item in rename_map:
        try:
            # 重命名文件
            item['old'].rename(item['new'])
            
            # 更新frontmatter中的slug
            with open(item['new'], 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 替换或添加slug字段
            if item['old_slug']:
                content = re.sub(
                    r'^slug:\s*.+?$',
                    f'slug: {item["new_slug"]}',
                    content,
                    flags=re.MULTILINE
                )
            else:
                # 在frontmatter末尾添加slug
                content = re.sub(
                    r'^(---\s*\n(?:.*\n)*?)(---\s*\n)',
                    f'\\1slug: {item["new_slug"]}\n\\2',
                    content,
                    count=1
                )
            
            with open(item['new'], 'w', encoding='utf-8') as f:
                f.write(content)
            
            renamed += 1
        except Exception as e:
            print(f'  错误: {item["old"].name} - {e}')
    
    print(f'\n完成！成功重命名 {renamed} 个文件')

if __name__ == '__main__':
    main()
