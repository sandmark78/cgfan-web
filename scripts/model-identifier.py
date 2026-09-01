#!/usr/bin/env python3
"""
统一的模型识别模块

根据 prompt 文本识别 AI 模型
"""

def identify_model(prompt_text: str, full_text: str = "") -> str:
    """
    识别 AI 模型
    
    Args:
        prompt_text: 提取的 prompt 内容
        full_text: 完整的推文文本（包含作者说明）
    
    Returns:
        模型名称（统一格式）
    """
    # 合并文本用于检测
    combined = (prompt_text + " " + full_text).lower()
    
    # GPT-Image 系列（统一为 GPT-Image 2）
    if any(kw in combined for kw in [
        'gpt image', 'gpt-image', 'gpt image 2', 'gpt-image2',
        'image 2', 'image2', '@创建图片', 'dall-e 3', 'dalle-3',
        'chatgpt image', 'openai image'
    ]):
        return 'GPT-Image 2'
    
    # Midjourney
    if any(kw in combined for kw in [
        'midjourney', ' mj ', '--ar ', '--sref ', '--v ', '--style',
        '--c ', '--q ', 'made with midjourney'
    ]):
        return 'Midjourney'
    
    # Gemini
    if any(kw in combined for kw in [
        'gemini', 'google gemini', 'imagen 3', 'imagen3'
    ]):
        return 'Gemini'
    
    # Grok
    if any(kw in combined for kw in [
        'grok', 'xai image', 'aurora flux'
    ]):
        return 'Grok'
    
    # Ideogram
    if any(kw in combined for kw in [
        'ideogram', 'ideogram.ai'
    ]):
        return 'Ideogram'
    
    # Flux
    if any(kw in combined for kw in [
        'flux', 'black forest labs', 'bfl '
    ]):
        return 'Flux'
    
    # Stable Diffusion
    if any(kw in combined for kw in [
        'stable diffusion', 'sd ', 'sdxl', 'comfyui', 'automatic1111'
    ]):
        return 'Stable Diffusion'
    
    # Recraft
    if any(kw in combined for kw in [
        'recraft', 'recraft.ai'
    ]):
        return 'Recraft'
    
    # Adobe Firefly
    if any(kw in combined for kw in [
        'firefly', 'adobe firefly'
    ]):
        return 'Adobe Firefly'
    
    # DALL-E（旧版本）
    if any(kw in combined for kw in [
        'dall-e', 'dalle', 'dall·e'
    ]):
        return 'DALL-E'
    
    # Leonardo
    if any(kw in combined for kw in [
        'leonardo', 'leonardo.ai'
    ]):
        return 'Leonardo'
    
    # Seedream（阿里）
    if any(kw in combined for kw in [
        'seedream', '通义万相', 'aliyun image'
    ]):
        return 'Seedream'
    
    # 可灵（快手）
    if any(kw in combined for kw in [
        'kling', '可灵'
    ]):
        return 'Kling'
    
    # 即梦（字节）
    if any(kw in combined for kw in [
        'jimeng', '即梦'
    ]):
        return 'Jimeng'
    
    # 无法识别
    return 'Unknown'


def normalize_model_name(model: str) -> str:
    """
    统一模型名称格式
    
    Args:
        model: 原始模型名称
    
    Returns:
        统一格式的模型名称
    """
    model_lower = model.lower().strip()
    
    # GPT-Image 系列
    if model_lower in ['gpt-image2', 'gpt image 2', 'gpt-image 2', 'image2', 'image 2']:
        return 'GPT-Image 2'
    
    # Midjourney
    if model_lower in ['midjourney', 'mj']:
        return 'Midjourney'
    
    # Gemini
    if model_lower in ['gemini', 'google gemini', 'imagen 3']:
        return 'Gemini'
    
    # 保持原样的模型
    known_models = [
        'Grok', 'Ideogram', 'Flux', 'Stable Diffusion', 'Recraft',
        'Adobe Firefly', 'DALL-E', 'Leonardo', 'Seedream', 'Kling', 'Jimeng'
    ]
    
    if model in known_models:
        return model
    
    # 未知模型
    return 'Unknown'
