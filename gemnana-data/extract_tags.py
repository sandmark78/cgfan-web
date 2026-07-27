#!/usr/bin/env python3
"""
从列表页提取标签并更新 parsed.json
"""

import json
import re
from pathlib import Path

def extract_tags_from_list_page():
    """从列表页 HTML 提取每个 case 的标签"""
    list_html = Path('list_page.html').read_text(encoding='utf-8')
    
    # 匹配 data-id="xxx" ... data-tags="tag1|tag2|tag3"
    pattern = r'data-id="(\d+)"[^>]*data-tags="([^"]*)"'
    matches = re.findall(pattern, list_html)
    
    tags_map = {}
    for case_id, tags_str in matches:
        tags = [t.strip() for t in tags_str.split('|') if t.strip()]
        tags_map[case_id] = tags
    
    return tags_map

def detect_model_from_tags(tags):
    """从标签推断模型"""
    tags_lower = [t.lower() for t in tags]
    
    # GPT Image 2
    if any('gpt image 2' in t or 'gpt img2' in t for t in tags_lower):
        return 'GPT-Image2'
    
    # GPT Image
    if any('gpt image' in t for t in tags_lower):
        return 'GPT-Image'
    
    # ChatGPT
    if any('chatgpt' in t for t in tags_lower):
        return 'ChatGPT'
    
    # Midjourney
    if any('midjourney' in t for t in tags_lower):
        return 'Midjourney'
    
    # Gemini
    if any('gemini' in t for t in tags_lower):
        return 'Gemini'
    
    # Grok
    if any('grok' in t for t in tags_lower):
        return 'Grok'
    
    # Nano Banana
    if any('nano banana' in t for t in tags_lower):
        return 'Nano Banana'
    
    # AI (通用)
    if any('ai' in t for t in tags_lower):
        return 'AI'
    
    return 'Common'

def main():
    # 提取标签
    print("从列表页提取标签...")
    tags_map = extract_tags_from_list_page()
    print(f"提取到 {len(tags_map)} 个 case 的标签")
    
    # 加载 parsed.json
    parsed_file = Path('parsed.json')
    with open(parsed_file, 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    # 更新标签和模型
    updated = 0
    for item in parsed:
        case_id = item['id']
        if case_id in tags_map:
            item['tags'] = tags_map[case_id]
            item['model'] = detect_model_from_tags(tags_map[case_id])
            updated += 1
    
    # 保存
    with open(parsed_file, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)
    
    print(f"已更新 {updated} 条数据")
    
    # 统计模型分布
    models = {}
    for item in parsed:
        model = item.get('model', 'Common')
        models[model] = models.get(model, 0) + 1
    
    print("\n模型分布:")
    for model, count in sorted(models.items(), key=lambda x: -x[1]):
        print(f"  {model}: {count}")

if __name__ == '__main__':
    main()
