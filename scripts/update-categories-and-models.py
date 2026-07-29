#!/usr/bin/env python3
"""
批量更新提示词分类和模型
1. 分类重构：把editorial拆分成更具体的分类
2. 模型清洗：从提示词文本识别真实模型
"""
import json
import re
import base64
from pathlib import Path

def decode_prompts():
    """从prompts-data.ts读取数据"""
    ts_file = Path('lib/prompts-data.ts')
    content = ts_file.read_text()
    
    # 提取base64字符串
    match = re.search(r'export default `([^`]+)`', content)
    if not match:
        raise ValueError("无法解析 prompts-data.ts")
    
    encoded = match.group(1)
    decoded = base64.b64decode(encoded).decode('utf-8')
    return json.loads(decoded)

def encode_prompts(prompts):
    """写入prompts-data.ts"""
    json_str = json.dumps(prompts, ensure_ascii=False, indent=2)
    encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
    ts_content = f'export default `{encoded}`;\n'
    
    ts_file = Path('lib/prompts-data.ts')
    ts_file.write_text(ts_content)

def detect_model_from_prompt(prompt_text):
    """从提示词文本识别模型"""
    text = prompt_text.lower()
    
    # GPT-Image2 相关关键词
    if any(kw in text for kw in ['gpt-image', 'gpt image', 'gptimage', 'chatgpt', 'dall-e', 'dalle']):
        return 'GPT-Image2'
    
    # Midjourney 相关关键词
    if any(kw in text for kw in ['midjourney', 'mj v', '--ar', '--v ', '--style', '--q ', '--s ']):
        return 'Midjourney'
    
    # Gemini 相关关键词
    if any(kw in text for kw in ['gemini', 'nano banana', 'google ai']):
        return 'Gemini'
    
    # Grok
    if 'grok' in text or 'xai' in text:
        return 'Grok'
    
    # Adobe Firefly
    if 'firefly' in text or 'adobe' in text:
        return 'Adobe Firefly'
    
    # Seedream
    if 'seedream' in text:
        return 'Seedream'
    
    # Leonardo
    if 'leonardo' in text:
        return 'Leonardo'
    
    # DALL-E
    if 'dall-e' in text or 'dalle' in text:
        return 'DALL-E'
    
    return None

def detect_category_from_content(prompt):
    """从提示词内容识别更具体的分类"""
    title = prompt.get('title', '').lower()
    prompt_text = prompt.get('prompt', '').lower()
    tags = [t.lower() for t in prompt.get('tags', [])]
    
    # 合并所有文本用于分析
    all_text = f"{title} {prompt_text} {' '.join(tags)}"
    
    # 人像/人物
    if any(kw in all_text for kw in ['人像', '人物', 'portrait', '人物写真', '人像摄影']):
        return 'portrait'
    
    # 产品/商业
    if any(kw in all_text for kw in ['产品', '商业', 'product', '广告', '品牌', '包装']):
        return 'product'
    
    # 摄影/写实
    if any(kw in all_text for kw in ['摄影', 'photography', '写实', '真实', 'realistic', '照片']):
        if any(kw in all_text for kw in ['超写实', 'hyperrealistic', 'photorealistic']):
            return 'photorealistic'
        return 'photography'
    
    # 海报
    if any(kw in all_text for kw in ['海报', 'poster', '宣传', 'banner']):
        return 'poster'
    
    # 3D渲染
    if any(kw in all_text for kw in ['3d', '渲染', 'render', 'blender', 'c4d', 'octane']):
        return '3d'
    
    # 插画
    if any(kw in all_text for kw in ['插画', 'illustration', '手绘', '绘画', 'drawing']):
        return 'illustration'
    
    # 复古
    if any(kw in all_text for kw in ['复古', 'retro', '怀旧', 'vintage', '昭和']):
        return 'retro'
    
    # 科幻
    if any(kw in all_text for kw in ['科幻', 'sci-fi', '赛博朋克', 'cyberpunk', '未来']):
        return 'sci-fi'
    
    # 奇幻
    if any(kw in all_text for kw in ['奇幻', 'fantasy', '魔幻', '神话', 'myth']):
        return 'fantasy'
    
    # 极简
    if any(kw in all_text for kw in ['极简', 'minimalist', '简约', '留白']):
        return 'minimalist'
    
    # 动漫
    if any(kw in all_text for kw in ['动漫', 'anime', '二次元', '漫画', 'manga']):
        return 'anime'
    
    # 风景
    if any(kw in all_text for kw in ['风景', 'landscape', '自然', '山水', '自然光']):
        return 'landscape'
    
    # 概念艺术
    if any(kw in all_text for kw in ['概念', 'concept', '概念艺术']):
        return 'concept-art'
    
    # 抽象
    if any(kw in all_text for kw in ['抽象', 'abstract']):
        return 'abstract'
    
    # 默认返回editorial（编辑设计/排版类）
    return 'editorial'

def main():
    print("📖 读取提示词数据...")
    prompts = decode_prompts()
    print(f"✅ 共 {len(prompts)} 条提示词")
    
    # 统计
    category_changes = 0
    model_changes = 0
    model_detected = 0
    
    for prompt in prompts:
        original_category = prompt.get('category')
        original_model = prompt.get('model')
        
        # 1. 分类重构：只处理editorial
        if original_category == 'editorial':
            new_category = detect_category_from_content(prompt)
            if new_category != original_category:
                prompt['category'] = new_category
                category_changes += 1
        
        # 2. 模型清洗：只处理Common
        if original_model == 'Common':
            detected_model = detect_model_from_prompt(prompt.get('prompt', ''))
            if detected_model:
                prompt['model'] = detected_model
                model_changes += 1
                model_detected += 1
    
    print(f"\n📊 更新统计:")
    print(f"   分类更新: {category_changes} 条")
    print(f"   模型识别: {model_detected} 条")
    
    # 写入
    print("\n💾 写入 prompts-data.ts...")
    encode_prompts(prompts)
    print("✅ 完成!")
    
    # 输出新的分类分布
    print("\n📈 新分类分布:")
    category_counts = {}
    for p in prompts:
        cat = p.get('category')
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"   {cat}: {count}")
    
    # 输出新的模型分布
    print("\n🤖 新模型分布:")
    model_counts = {}
    for p in prompts:
        model = p.get('model')
        model_counts[model] = model_counts.get(model, 0) + 1
    
    for model, count in sorted(model_counts.items(), key=lambda x: -x[1]):
        print(f"   {model}: {count}")

if __name__ == '__main__':
    main()
