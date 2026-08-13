#!/usr/bin/env python3
"""
规则化评估：标题/标签/评分/过滤
纯 Python 规则，不依赖 LLM，确保 cron 稳定执行。
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import PREPROCESSED, EVALUATED, MIN_SCORE, should_filter, PORTRAIT_EXCEPTIONS

# 导入品味加分
from taste_bonus import calculate_taste_adjustment, apply_adjustment

# ====== 标题生成规则 ======
TITLE_RULES = [
    # (关键词列表, 标题模板)
    (['海报', 'poster'], '主题海报：{subject}'),
    (['品牌', 'brand', 'logo'], '品牌全案：{subject}'),
    (['古风', '东方', '水墨', '仙侠', '中国'], '东方意境：{subject}'),
    (['旅行', 'travel', '城市', 'city'], '城市记忆：{subject}'),
    (['微缩', 'miniature', '纸艺', 'paper cut', '立体'], '微缩世界：{subject}'),
    (['电影', 'cinematic', '胶片', 'film', '35mm'], '电影感场景：{subject}'),
    (['水彩', 'watercolor'], '水彩渲染：{subject}'),
    (['3d', 'render', '渲染'], '3D视觉：{subject}'),
    (['编辑', 'editorial', '排版', 'typography'], '编辑设计：{subject}'),
    (['时尚', 'fashion', '服装'], '时尚视觉：{subject}'),
    (['插画', 'illustration', '绘画'], '插画风格：{subject}'),
    (['建筑', 'architecture', '空间'], '建筑空间：{subject}'),
]

def generate_title(prompt: str) -> str:
    """根据 prompt 内容生成标题（≤20字）"""
    prompt_lower = prompt.lower()
    
    for keywords, template in TITLE_RULES:
        if any(kw in prompt_lower for kw in keywords):
            # 提取主题词
            subject = extract_subject(prompt)
            title = template.format(subject=subject)
            if len(title) <= 20:
                return title
            return title[:20]
    
    # 默认标题
    subject = extract_subject(prompt)
    title = f"AI视觉创作：{subject}"
    return title[:20] if len(title) > 20 else title

def extract_subject(prompt: str) -> str:
    """从 prompt 提取主题词（≤10字）"""
    # 优先提取中文主题
    chinese_patterns = [
        r'主题[：:]\s*(.{2,10})',
        r'场景[：:]\s*(.{2,10})',
        r'风格[：:]\s*(.{2,10})',
    ]
    for pattern in chinese_patterns:
        match = re.search(pattern, prompt)
        if match:
            return match.group(1).strip()[:10]
    
    # 提取第一个有意义的中文短语
    lines = prompt.split('\n')
    for line in lines:
        line = line.strip()
        if 2 <= len(line) <= 10 and re.search(r'[\u4e00-\u9fff]', line):
            return line
    
    # fallback
    return "视觉探索"

# ====== 标签生成规则 ======
TAG_RULES = [
    (['海报', 'poster'], '海报设计'),
    (['编辑', 'editorial', '排版', 'typography'], '编辑设计'),
    (['古风', '东方', '水墨', '仙侠', '中国', '国风'], '东方美学'),
    (['仙侠'], '仙侠'),
    (['旅行', 'travel'], '旅行'),
    (['微缩', 'miniature'], '微缩'),
    (['纸艺', 'paper cut', '立体'], '纸艺'),
    (['电影', 'cinematic', 'film', '胶片', '35mm'], '电影感'),
    (['品牌', 'brand', 'logo'], '品牌设计'),
    (['3d', 'render', '渲染'], '3D渲染'),
    (['水彩', 'watercolor'], '水彩'),
    (['人像', '人物', 'portrait'], '人像'),
    (['复古', 'retro', 'vintage'], '复古'),
    (['建筑', 'architecture'], '建筑'),
    (['时尚', 'fashion'], '时尚'),
    (['插画', 'illustration'], '插画'),
    (['摄影', 'photography'], '摄影'),
    (['极简', 'minimal'], '极简'),
]

def generate_tags(prompt: str) -> list:
    """根据 prompt 内容生成标签（3-5个）"""
    prompt_lower = prompt.lower()
    tags = []
    
    for keywords, tag in TAG_RULES:
        if any(kw in prompt_lower for kw in keywords):
            tags.append(tag)
            if len(tags) >= 5:
                break
    
    # 确保至少3个标签
    fallback_tags = ['视觉设计', 'AI创作', '创意']
    for tag in fallback_tags:
        if len(tags) >= 3:
            break
        if tag not in tags:
            tags.append(tag)
    
    return tags[:5]

# ====== 基础评分规则 ======
def base_score(prompt: str) -> dict:
    """根据 prompt 内容给出基础评分（8维度）"""
    prompt_lower = prompt.lower()
    
    # 默认基础分8
    scores = {
        'composition': 8,
        'color': 8,
        'lighting': 8,
        'detail': 8,
        'creativity': 8,
        'technical': 8,
        'aesthetic': 8,
        'curation': 8,
    }
    
    # 设计/排版类 → 创意和策展突出
    if any(kw in prompt_lower for kw in ['poster', 'editorial', 'layout', 'typography', '海报', '排版', '设计']):
        scores['creativity'] = 9
        scores['curation'] = 9
    
    # 古风/东方美学 → 审美突出
    if any(kw in prompt for kw in ['古风', '东方', '水墨', '仙侠', '中国', '宋式', '禅意']):
        scores['aesthetic'] = 9
        scores['curation'] = 9
        scores['composition'] = 9
    
    # 微缩/工艺 → 细节和创意突出
    if any(kw in prompt_lower for kw in ['miniature', 'micro', 'paper cut', 'diorama', '微缩', '纸艺', '立体']):
        scores['detail'] = 9
        scores['creativity'] = 9
    
    # 电影感/胶片 → 光影突出
    if any(kw in prompt_lower for kw in ['cinematic', 'film', '35mm', 'ccd', '电影感', '胶片']):
        scores['lighting'] = 9
        scores['curation'] = 9
    
    # 旅行海报 → 色彩和构图突出
    if any(kw in prompt_lower for kw in ['travel poster', '旅行海报', 'vintage travel']):
        scores['composition'] = 9
        scores['color'] = 9
        scores['creativity'] = 9
    
    # 人像（非私房/COS）
    if any(kw in prompt for kw in ['人像', '人物', 'portrait', 'woman', 'man', '女性', '男性']):
        if any(kw in prompt for kw in PORTRAIT_EXCEPTIONS):
            scores['aesthetic'] = 9
            scores['lighting'] = 9
        else:
            scores['aesthetic'] = 7  # 普通人像降分
    
    # 品牌/LOGO设计
    if any(kw in prompt_lower for kw in ['logo', 'brand', '品牌', '标志']):
        scores['creativity'] = 9
        scores['curation'] = 9
    
    # 建筑/空间
    if any(kw in prompt_lower for kw in ['architecture', '建筑', 'interior', '空间', 'brutalist']):
        scores['composition'] = 9
        scores['technical'] = 9
    
    return scores

# ====== 主流程 ======
def evaluate_item(item: dict) -> dict:
    """评估单条数据"""
    prompt = item.get('prompt', '')
    tweet_id = item.get('tweet_id', '')
    
    # 1. 过滤检查
    should_skip, reason = should_filter(prompt, item.get('has_video', False))
    if should_skip:
        return {
            'tweet_id': tweet_id,
            'status': 'filtered',
            'reason': reason,
        }
    
    # 2. 生成标题和标签
    title = generate_title(prompt)
    tags = generate_tags(prompt)
    
    # 3. 基础评分
    scores = base_score(prompt)
    
    # 4. 品味加分
    adjustment = calculate_taste_adjustment(prompt, tags)
    final_scores = apply_adjustment(scores, adjustment)
    
    # 5. 计算总分
    total = sum(final_scores.values())
    
    # 6. 判断是否达到门槛
    status = 'pass' if total >= MIN_SCORE else 'below_threshold'
    
    return {
        'tweet_id': tweet_id,
        'status': status,
        'title': title,
        'tags': tags,
        'scores': final_scores,
        'total_score': total,
        'adjustment': adjustment,
        # 保留原始数据
        'author': item.get('author', ''),
        'authorLink': item.get('authorLink', ''),
        'date': item.get('date', ''),
        'model': item.get('model', '通用 Prompt'),
        'prompt': prompt,
        'imgs': item.get('imgs', []),
        'images': item.get('images', []),
        'source': item.get('source', ''),
    }

def main():
    """主流程"""
    print("🎯 规则化评估：标题/标签/评分/过滤")
    print("=" * 60)
    
    if not PREPROCESSED.exists():
        print(f"❌ 未找到预处理数据: {PREPROCESSED}")
        sys.exit(1)
    
    with open(PREPROCESSED, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    print(f"📥 读取到 {len(items)} 条预处理数据")
    
    results = []
    filtered = 0
    passed = 0
    below = 0
    
    for item in items:
        result = evaluate_item(item)
        results.append(result)
        
        if result['status'] == 'filtered':
            filtered += 1
            print(f"  🚫 过滤: {result['tweet_id']} ({result['reason']})")
        elif result['status'] == 'pass':
            passed += 1
            print(f"  ✅ 通过: {result['tweet_id']} ({result['total_score']}分) {result['title']}")
        else:
            below += 1
            print(f"  ⚠️ 未达标: {result['tweet_id']} ({result['total_score']}分)")
    
    print(f"\n📊 评估完成: {passed}通过 / {below}未达标 / {filtered}过滤")
    
    # 保存结果
    with open(EVALUATED, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"💾 结果已保存: {EVALUATED}")

if __name__ == '__main__':
    main()
