#!/usr/bin/env python3
"""
品味加分/减分计算脚本

根据用户美学品味画像（IMAGE_TASTE.md），对提示词进行客观评分调整。
替代LLM主观判断，确保评分稳定一致。

用法：
    from taste_bonus import calculate_taste_adjustment
    adjustment = calculate_taste_adjustment(prompt, tags)
    # adjustment = {'composition': 1, 'aesthetic': -1, ...}
"""

def calculate_taste_adjustment(prompt: str, tags: list) -> dict:
    """
    计算品味加分/减分
    
    规则：每个维度最多加1分，避免重复加分导致分数过高
    
    Args:
        prompt: 提示词文本
        tags: 标签列表
    
    Returns:
        dict: 各维度的调整值（+1, 0, -1）
    """
    prompt_lower = prompt.lower()
    tags_lower = [t.lower() for t in tags]
    adjustment = {
        'composition': 0,
        'color': 0,
        'lighting': 0,
        'detail': 0,
        'creativity': 0,
        'technical': 0,
        'aesthetic': 0,
        'curation': 0
    }
    
    # ===== 加分项（每个维度最多加1分）=====
    
    # 1. 东方美学+留白+诗意 → 构图/审美+1
    if any(kw in prompt_lower for kw in ['东方', 'oriental', '古风', '水墨', '留白']):
        if any(kw in prompt_lower for kw in ['诗意', 'poetic', '意境', '禅意']):
            adjustment['composition'] = max(adjustment['composition'], 1)
            adjustment['aesthetic'] = max(adjustment['aesthetic'], 1)
    
    # 2. 微缩+工艺感+叙事性 → 创意/细节+1
    if any(kw in prompt_lower for kw in ['微缩', 'miniature', '纸艺', 'paper cut', '立体']):
        if any(kw in prompt_lower for kw in ['叙事', '故事', 'narrative', '工艺', 'craft']):
            adjustment['creativity'] = max(adjustment['creativity'], 1)
            adjustment['detail'] = max(adjustment['detail'], 1)
    
    # 3. 复古未来主义+有限配色 → 色彩/审美+1
    if any(kw in prompt_lower for kw in ['复古', 'retro', '未来主义', 'futurism']):
        if any(kw in prompt_lower for kw in ['有限配色', 'limited palette', '克制', 'restrained']):
            adjustment['color'] = max(adjustment['color'], 1)
            adjustment['aesthetic'] = max(adjustment['aesthetic'], 1)
    
    # 4. 胶片感+电影感+孤独情绪 → 光影/策展+1
    if any(kw in prompt_lower for kw in ['胶片', 'film', '35mm', 'ccd']):
        if any(kw in prompt_lower for kw in ['电影感', 'cinematic', '孤独', 'lonely']):
            adjustment['lighting'] = max(adjustment['lighting'], 1)
            adjustment['curation'] = max(adjustment['curation'], 1)
    
    # 5. 自然材质奇幻转化 → 创意+1
    if any(kw in prompt_lower for kw in ['花卉', 'flower', '蜂巢', 'honeycomb', '自然材质']):
        if any(kw in prompt_lower for kw in ['奇幻', 'fantasy', '转化', 'transform']):
            adjustment['creativity'] = max(adjustment['creativity'], 1)
    
    # 6. 纸艺工艺+立体剪纸 → 细节/创意+1
    if any(kw in prompt_lower for kw in ['纸艺', 'paper art', '剪纸', 'paper cut', '立体剪纸']):
        adjustment['detail'] = max(adjustment['detail'], 1)
        adjustment['creativity'] = max(adjustment['creativity'], 1)
    
    # 7. 编辑设计+字体排版即图形 → 策展+1
    if any(kw in prompt_lower for kw in ['编辑设计', 'editorial', '排版', 'typography']):
        if any(kw in prompt_lower for kw in ['字体即图形', 'type as image', '文字排版']):
            adjustment['curation'] = max(adjustment['curation'], 1)
    
    # 8. 故事书绘本风 → 创意+1
    if any(kw in prompt_lower for kw in ['故事书', 'storybook', '绘本', 'picture book']):
        adjustment['creativity'] = max(adjustment['creativity'], 1)
    
    # 9. 旅行+手绘+城市记忆 → 构图/创意+1
    if any(kw in prompt_lower for kw in ['旅行', 'travel', '城市', 'city']):
        if any(kw in prompt_lower for kw in ['手绘', 'hand-drawn', 'illustration', '记忆']):
            adjustment['composition'] = max(adjustment['composition'], 1)
            adjustment['creativity'] = max(adjustment['creativity'], 1)
    
    # ===== 减分项（每个维度最多减1分）=====
    
    # 1. 纯商业产品/广告 → 审美-1, 策展-1
    if any(kw in prompt_lower for kw in ['产品', 'product', '广告', 'advertisement', 'commercial']):
        if not any(kw in prompt_lower for kw in ['艺术', 'art', '创意', 'creative']):
            adjustment['aesthetic'] = min(adjustment['aesthetic'], -1)
            adjustment['curation'] = min(adjustment['curation'], -1)
    
    # 2. 构图太满无留白 → 构图-1
    if any(kw in prompt_lower for kw in ['构图太满', 'crowded', '密集', 'dense']):
        if not any(kw in prompt_lower for kw in ['留白', 'negative space', 'breathing']):
            adjustment['composition'] = min(adjustment['composition'], -1)
    
    # 3. AI塑料感/过度渲染 → 细节-1, 审美-1
    if any(kw in prompt_lower for kw in ['塑料感', 'plastic', '过度渲染', 'over-rendered']):
        adjustment['detail'] = min(adjustment['detail'], -1)
        adjustment['aesthetic'] = min(adjustment['aesthetic'], -1)
    
    # 4. 纯写实无叙事 → 创意-1
    if any(kw in prompt_lower for kw in ['写实', 'realistic', 'photorealistic']):
        if not any(kw in prompt_lower for kw in ['叙事', 'narrative', '故事', 'story', '意境']):
            adjustment['creativity'] = min(adjustment['creativity'], -1)
    
    # 5. 千篇一律的题材 → 创意-1
    # 检测常见模板化题材
    template_patterns = ['模板', 'template', '框架', 'framework', '通用', 'generic']
    if any(kw in prompt_lower for kw in template_patterns):
        adjustment['creativity'] = min(adjustment['creativity'], -1)
    
    return adjustment


def apply_adjustment(base_scores: dict, adjustment: dict) -> dict:
    """
    应用品味调整到基础评分
    
    Args:
        base_scores: 基础评分（8维度）
        adjustment: 调整值
    
    Returns:
        dict: 调整后的评分
    """
    final_scores = {}
    for dim, base_score in base_scores.items():
        adj = adjustment.get(dim, 0)
        final_score = max(1, min(10, base_score + adj))  # 限制在1-10
        final_scores[dim] = final_score
    return final_scores


if __name__ == '__main__':
    # 测试示例
    test_prompt = "微缩纸艺旅行箱，立体剪纸城市，叙事性手工感"
    test_tags = ["微缩", "纸艺", "旅行", "叙事"]
    
    adj = calculate_taste_adjustment(test_prompt, test_tags)
    print(f"品味调整: {adj}")
    
    base_scores = {
        'composition': 8,
        'color': 8,
        'lighting': 8,
        'detail': 8,
        'creativity': 8,
        'technical': 8,
        'aesthetic': 8,
        'curation': 8
    }
    
    final = apply_adjustment(base_scores, adj)
    print(f"基础评分: {sum(base_scores.values())}")
    print(f"最终评分: {sum(final.values())}")
