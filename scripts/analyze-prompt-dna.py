#!/usr/bin/env python3
"""
Prompt DNA 分析系统
自动分析提示词的结构特征，生成 DNA 数据
"""
import json
import base64
import re
from pathlib import Path
from typing import Dict, List, Tuple

# 风格关键词映射
STYLE_KEYWORDS = {
    '电影感': ['cinematic', 'film', 'movie', '镜头', '胶片', '电影'],
    '东方美学': ['东方', '中国', '古风', '水墨', '禅意', 'oriental', 'chinese', 'zen'],
    '极简': ['minimal', '极简', '简约', '留白', 'simple', 'clean'],
    '摄影': ['摄影', 'photography', 'photo', 'realistic', '写实', '真实'],
    '插画': ['插画', 'illustration', 'drawing', '手绘', '绘画'],
    '3D渲染': ['3d', 'render', 'blender', 'c4d', 'octane', '渲染'],
    '赛博朋克': ['cyberpunk', '赛博', '霓虹', 'neon', 'future'],
    '复古': ['复古', 'retro', 'vintage', '怀旧', '昭和'],
    '奇幻': ['fantasy', '奇幻', '魔幻', '神话', 'myth', 'magic'],
    '抽象': ['abstract', '抽象', '几何', 'geometric'],
}

# 光线关键词
LIGHTING_KEYWORDS = {
    '背光': ['backlight', '背光', '逆光', 'rim light'],
    '柔光': ['soft light', '柔光', '柔和', 'diffused'],
    '硬光': ['hard light', '硬光', '强烈', 'dramatic'],
    '自然光': ['natural light', '自然光', '日光', 'sunlight'],
    '体积光': ['volumetric', '体积光', '光束', 'god rays', 'light rays'],
    '霓虹光': ['neon', '霓虹', '荧光', 'glow'],
}

# 构图关键词
COMPOSITION_KEYWORDS = {
    '对称': ['symmetry', '对称', '居中', 'centered'],
    '三分法': ['rule of thirds', '三分法', '三分构图'],
    '特写': ['close-up', '特写', 'closeup', 'macro'],
    '广角': ['wide angle', '广角', '全景', 'panoramic'],
    '俯拍': ['top view', '俯拍', '鸟瞰', 'aerial', 'drone'],
    '仰拍': ['low angle', '仰拍', '低角度'],
}

# 材质关键词
MATERIAL_KEYWORDS = {
    '金属': ['metal', '金属', 'steel', 'chrome', '不锈钢'],
    '玻璃': ['glass', '玻璃', '透明', 'transparent', 'crystal'],
    '布料': ['fabric', '布料', '丝绸', 'silk', 'cloth', '纺织'],
    '木质': ['wood', '木', '木质', 'wooden'],
    '皮肤': ['skin', '皮肤', '肌肤', '真实皮肤'],
    '水墨': ['ink', '水墨', '墨迹', '宣纸'],
}

# 适用模型特征
MODEL_SUITABILITY = {
    'GPT Image 2': {
        'strengths': ['写实', '摄影', '人像', '细节丰富', '复杂场景'],
        'keywords': ['realistic', 'photography', 'portrait', 'detailed', 'cinematic', 'ultra'],
    },
    'Midjourney': {
        'strengths': ['艺术感', '风格化', '插画', '奇幻', '概念艺术'],
        'keywords': ['artistic', 'stylized', 'illustration', 'fantasy', 'concept', 'art', 'beautiful'],
    },
    'Gemini': {
        'strengths': ['文字理解', '复杂指令', '多元素', '场景构建'],
        'keywords': ['complex', 'detailed scene', 'multiple elements', 'narrative'],
    },
    'Flux': {
        'strengths': ['写实', '人像', '摄影', '高质量'],
        'keywords': ['realistic', 'portrait', 'photography', 'high quality', 'professional'],
    },
    'Stable Diffusion': {
        'strengths': ['可控性强', 'LoRA', 'ControlNet', '自定义'],
        'keywords': ['controlnet', 'lora', 'custom', 'specific style', 'workflow'],
    },
}

def analyze_style(prompt_text: str) -> Dict[str, int]:
    """分析风格维度"""
    scores = {}
    text = prompt_text.lower()
    
    for style, keywords in STYLE_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            count = text.count(keyword.lower())
            score += min(count * 20, 100)  # 每个关键词最多贡献100分
        scores[style] = min(score, 100)
    
    return scores

def analyze_lighting(prompt_text: str) -> Dict[str, int]:
    """分析光线维度"""
    scores = {}
    text = prompt_text.lower()
    
    for lighting, keywords in LIGHTING_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in text:
                score += 50
        scores[lighting] = min(score, 100)
    
    return scores

def analyze_composition(prompt_text: str) -> Dict[str, int]:
    """分析构图维度"""
    scores = {}
    text = prompt_text.lower()
    
    for comp, keywords in COMPOSITION_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in text:
                score += 50
        scores[comp] = min(score, 100)
    
    return scores

def analyze_material(prompt_text: str) -> Dict[str, int]:
    """分析材质维度"""
    scores = {}
    text = prompt_text.lower()
    
    for material, keywords in MATERIAL_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in text:
                score += 50
        scores[material] = min(score, 100)
    
    return scores

def analyze_complexity(prompt_text: str) -> int:
    """分析复杂度（1-5星）"""
    length = len(prompt_text)
    word_count = len(prompt_text.split())
    
    # 基于长度和词数评估
    if length > 2000 or word_count > 300:
        return 5
    elif length > 1000 or word_count > 150:
        return 4
    elif length > 500 or word_count > 80:
        return 3
    elif length > 200 or word_count > 30:
        return 2
    else:
        return 1

def analyze_reproducibility(prompt_text: str) -> int:
    """分析复现难度（1-5星，越容易复现分数越低）"""
    # 检查是否有具体的参数、负面提示词等
    has_negative = 'negative prompt' in prompt_text.lower() or '负向' in prompt_text
    has_params = any(kw in prompt_text.lower() for kw in ['--ar', '--v', '--s', 'cfg', 'steps'])
    has_specific = any(kw in prompt_text.lower() for kw in ['specific', 'exact', 'precise', '准确', '精确'])
    
    difficulty = 1
    if has_negative:
        difficulty += 1
    if has_params:
        difficulty += 1
    if has_specific:
        difficulty += 1
    if len(prompt_text) > 1000:
        difficulty += 1
    
    return min(difficulty, 5)

def recommend_models(prompt_text: str, style_scores: Dict[str, int]) -> List[Dict[str, str]]:
    """推荐适合的模型"""
    text = prompt_text.lower()
    recommendations = []
    
    for model, info in MODEL_SUITABILITY.items():
        score = 0
        
        # 检查关键词匹配
        for keyword in info['keywords']:
            if keyword.lower() in text:
                score += 20
        
        # 检查风格匹配
        for style, strength in zip(info['strengths'], [1] * len(info['strengths'])):
            if style in style_scores and style_scores[style] > 50:
                score += 15
        
        # 转换为推荐等级
        if score >= 60:
            level = '非常适合'
        elif score >= 40:
            level = '适合'
        elif score >= 20:
            level = '可用'
        else:
            continue
        
        recommendations.append({
            'model': model,
            'level': level,
            'score': score
        })
    
    # 按分数排序
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    return recommendations[:3]  # 只返回前3个推荐

def analyze_prompt(prompt_data: Dict) -> Dict:
    """分析单条提示词，生成 DNA 数据"""
    prompt_text = prompt_data.get('prompt', '')
    
    if not prompt_text:
        return {}
    
    # 分析各维度
    style_scores = analyze_style(prompt_text)
    lighting_scores = analyze_lighting(prompt_text)
    composition_scores = analyze_composition(prompt_text)
    material_scores = analyze_material(prompt_text)
    
    # 提取主要特征（得分最高的）
    top_styles = sorted(
        [(k, v) for k, v in style_scores.items() if v > 0],
        key=lambda x: x[1],
        reverse=True
    )[:3]
    
    top_lighting = sorted(
        [(k, v) for k, v in lighting_scores.items() if v > 0],
        key=lambda x: x[1],
        reverse=True
    )[:2]
    
    top_composition = sorted(
        [(k, v) for k, v in composition_scores.items() if v > 0],
        key=lambda x: x[1],
        reverse=True
    )[:2]
    
    top_material = sorted(
        [(k, v) for k, v in material_scores.items() if v > 0],
        key=lambda x: x[1],
        reverse=True
    )[:2]
    
    # 计算综合指标
    complexity = analyze_complexity(prompt_text)
    reproducibility = analyze_reproducibility(prompt_text)
    
    # 推荐模型
    model_recommendations = recommend_models(prompt_text, style_scores)
    
    return {
        'dna': {
            'styles': top_styles,
            'lighting': top_lighting,
            'composition': top_composition,
            'material': top_material,
        },
        'metrics': {
            'complexity': complexity,
            'reproducibility': reproducibility,
        },
        'recommended_models': model_recommendations,
    }

def main():
    """主函数：批量分析提示词"""
    # 从 Supabase 读取数据
    try:
        from scripts.supabase_utils import get_all_prompts, upsert_many
        prompts = get_all_prompts()
        print(f"📊 从 Supabase 读取到 {len(prompts)} 条提示词")
    except Exception as e:
        print(f"⚠️ Supabase 读取失败，降级到文件读取: {e}")
        ts_file = Path('lib/prompts-data.ts')
        content = ts_file.read_text()
        match = re.search(r'export default `([^`]+)`', content)
        if not match:
            raise ValueError("无法解析 prompts-data.ts")
        encoded = match.group(1)
        decoded = base64.b64decode(encoded).decode('utf-8')
        prompts = json.loads(decoded)
    
    print(f"📊 开始分析 {len(prompts)} 条提示词...")
    
    # 分析每条提示词
    for i, prompt in enumerate(prompts):
        if i % 100 == 0:
            print(f"  进度: {i}/{len(prompts)}")
        
        dna_data = analyze_prompt(prompt)
        if dna_data:
            prompt['promptDNA'] = dna_data
    
    # 写回文件（兼容旧版）
    json_str = json.dumps(prompts, ensure_ascii=False, indent=2)
    encoded = base64.b64encode(json_str.encode('utf-8')).decode('utf-8')
    ts_content = f'export default `{encoded}`;\n'
    ts_file = Path('lib/prompts-data.ts')
    ts_file.write_text(ts_content)
    
    # 同步到 Supabase
    try:
        synced = upsert_many(prompts)
        print(f"✅ Supabase 同步成功: {synced} 条")
    except Exception as e:
        print(f"⚠️ Supabase 同步异常: {e}")
    
    print(f"✅ 完成！已为 {len(prompts)} 条提示词生成 DNA 数据")

if __name__ == '__main__':
    main()
