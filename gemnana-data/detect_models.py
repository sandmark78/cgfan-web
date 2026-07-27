#!/usr/bin/env python3
"""
从标题和摘要推断 AI 模型
"""

import json
from pathlib import Path

def detect_model(title, summary, prompt):
    """从标题、摘要和提示词推断模型"""
    text = f"{title} {summary} {prompt}".lower()
    
    # GPT Image 2 / GPT-Image2
    if any(kw in text for kw in ['gpt image 2', 'gpt image2', 'gpt-image 2', 'gpt-image2', 'gpt img2', 'gpt img 2']):
        return 'GPT-Image2'
    
    # GPT Image (v1)
    if any(kw in text for kw in ['gpt image', 'gpt-image', 'gpt img']):
        return 'GPT-Image'
    
    # GPT-4o
    if 'gpt-4o' in text or 'gpt 4o' in text:
        return 'GPT-4o'
    
    # ChatGPT (without specific image model)
    if 'chatgpt' in text and not any(kw in text for kw in ['gpt image', 'gpt-image']):
        return 'ChatGPT'
    
    # Midjourney
    if any(kw in text for kw in ['midjourney', ' mj ', '--ar', '--v ', '--style']):
        return 'Midjourney'
    
    # Gemini / Imagen
    if any(kw in text for kw in ['gemini', 'imagen']):
        return 'Gemini'
    
    # Grok
    if 'grok' in text:
        return 'Grok'
    
    # Stable Diffusion
    if any(kw in text for kw in ['stable diffusion', 'sdxl', 'comfyui']):
        return 'Stable Diffusion'
    
    # Flux
    if 'flux' in text:
        return 'Flux'
    
    # Adobe Firefly
    if any(kw in text for kw in ['firefly', 'adobe']):
        return 'Adobe Firefly'
    
    # Leonardo
    if 'leonardo' in text:
        return 'Leonardo'
    
    # Nano Banana (Gemnana 特有标签)
    if 'nano banana' in text:
        return 'Nano Banana'
    
    # 默认
    return 'Common'

def main():
    parsed_file = Path('parsed.json')
    with open(parsed_file, 'r', encoding='utf-8') as f:
        parsed = json.load(f)
    
    models = {}
    for item in parsed:
        title = item.get('title', '')
        summary = item.get('summary', '')
        prompt = item.get('english_prompt', '') or item.get('chinese_prompt', '')
        
        model = detect_model(title, summary, prompt)
        item['model'] = model
        models[model] = models.get(model, 0) + 1
    
    with open(parsed_file, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)
    
    print(f"已更新 {len(parsed)} 条数据的模型信息")
    print("\n模型分布:")
    for model, count in sorted(models.items(), key=lambda x: -x[1]):
        print(f"  {model}: {count}")

if __name__ == '__main__':
    main()
