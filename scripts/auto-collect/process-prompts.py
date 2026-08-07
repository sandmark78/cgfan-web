#!/usr/bin/env python3
"""
处理采集到的推文 — 全自动流程
采集 → 提取 → 评分 → DNA分析 → 部署

复用成熟技能：
- prompt 提取：复用 prompt-extraction-patterns.md 中的多格式提取逻辑
- 模型识别：复用 identify_model() 可信度优先策略
- 评分：8维度关键词评分
- DNA分析：复用 analyze-prompt-dna.py
"""

import json
import subprocess
import sys
import re
import os
from pathlib import Path
from datetime import datetime

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

# ====== 复用技能：模型识别（可信度优先） ======
def identify_model(text):
    """从文本中识别模型，不明确标注则标记为'通用 Prompt'"""
    text_lower = text.lower()
    # GPT-Image2 信号（含中文命令）
    if any(k in text_lower for k in [
        'gpt image 2', 'gpt-image2', 'gpt-image-2', 'gpt image2',
        'chatgpt-image2', 'chatgpt image2', '创建图片', 'generate image',
        'dall-e 3', 'dall-e-3', 'dalle-3'
    ]):
        return 'GPT-Image2'
    if 'midjourney' in text_lower or ' mj ' in text_lower or text_lower.startswith('mj ') or '--ar' in text or '--sref' in text or '--cref' in text:
        return 'Midjourney'
    if 'gemini' in text_lower:
        return 'Gemini'
    if 'dall-e' in text_lower or 'dalle' in text_lower:
        return 'DALL-E'
    if 'stable diffusion' in text_lower or 'sd ' in text_lower:
        return 'Stable Diffusion'
    if 'flux' in text_lower:
        return 'Flux'
    if 'seedream' in text_lower:
        return 'Seedream'
    return '通用 Prompt'

# ====== 复用技能：多格式 prompt 提取 ======
def extract_clean_prompt(all_text, imgs=None):
    """从完整推文中提取 prompt，支持多种格式（复用 prompt-extraction-patterns.md）
    
    提取优先级：
    1. 正文中的提示词标记（提示词：/ Prompt: 等）
    2. 正文中的内联 prompt（靠特征关键词识别）
    3. 图片 ALT text（很多作者把 prompt 写在图片描述里）
    """
    articles = re.findall(r'===ARTICLE \d+===(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
    
    for art in articles:
        # 跳过系统 prompt
        if 'SYSTEM PROMPT' in art:
            continue
        
        # 格式1: "提示词：" / "Prompt:" / "提示词Prompt：" / 日文 "【GPT Image2プロンプト】"
        patterns_prefix = [
            r'(?:提示词|Prompt)[：:]\s*\n(.+?)(?=\n[A-Z][a-z]+\s+@|\n\d{1,2}:\d{2}\s+[AP]M|\Z)',
            r'【GPT Image2プロンプト】\s*\n(.+?)(?=\n[A-Z][a-z]+\s+@|\n\d{1,2}:\d{2}\s+[AP]M|\Z)',
        ]
        for pattern in patterns_prefix:
            match = re.search(pattern, art, re.DOTALL | re.IGNORECASE)
            if match:
                prompt = match.group(1).strip()
                if len(prompt) > 50:
                    return clean_prompt(prompt)
        
        # 格式2: 正文中直接包含 prompt（无前缀标记）
        inline_keywords = [
            'input ::', 'step_1', 'Scene_Type', '2x2 grid',
            '国风CG插画', '唐风美学', 'pen and ink drawing',
            'Fine art black and white', '比例：4:3', '主题：用[',
        ]
        if any(kw in art for kw in inline_keywords):
            prompt = extract_inline_prompt(art)
            if prompt and len(prompt) > 50:
                return clean_prompt(prompt)
    
    # 格式3: 从图片 ALT text 提取（最后手段）
    if imgs:
        for img in imgs:
            alt = img.get('alt', '') if isinstance(img, dict) else ''
            # ALT text 必须足够长才像是 prompt（不是简单的图片描述）
            if len(alt) > 80:
                # 检查是否包含 prompt 特征词
                prompt_indicators = [
                    'illustration', 'portrait', 'landscape', 'scene', 'render',
                    'cinematic', 'detailed', 'style', 'aesthetic', 'composition',
                    'lighting', 'color', 'texture', 'atmosphere', 'mood',
                    'photography', 'camera', 'lens', 'aspect ratio',
                    'ultra', 'highly detailed', 'realistic', 'fantasy',
                    'vintage', 'retro', 'futuristic', 'surreal',
                ]
                alt_lower = alt.lower()
                if any(kw in alt_lower for kw in prompt_indicators):
                    print(f"  📸 从图片 ALT text 提取到 prompt ({len(alt)} 字符)")
                    return alt.strip()
    
    return None

def extract_inline_prompt(art_text):
    """提取正文中无标记的 prompt"""
    lines = art_text.split('\n')
    prompt_lines = []
    for line in lines:
        if re.match(r'^[A-Z][a-z]+\s+@[^\s]+$', line.strip()):
            if prompt_lines: break
            continue
        if re.match(r'^\d{1,2}:\d{2}\s+(AM|PM)', line.strip()):
            if prompt_lines: break
            continue
        if line.strip() in ['Views', 'Made with AI', 'Made with Gemini']:
            continue
        if re.match(r'^\d+(\.\d+)?[KMB]?$', line.strip()) and len(line.strip()) < 10:
            continue
        if len(line.strip()) > 20:
            prompt_lines.append(line)
    return '\n'.join(prompt_lines).strip() if prompt_lines else None

def clean_prompt(prompt):
    """清理提取的 prompt — 去除作者信息、推文正文、互动数据"""
    # 移除推文正文中的感性文字（"她只是来试一件衣服..." 这类）
    # 通常在 prompt 末尾，以作者名/日期/互动数据开头
    lines = prompt.split('\n')
    clean_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # 跳过作者信息行（中文名+英文名 或 @handle）
        if re.match(r'^[A-Za-z\u4e00-\u9fff]+\s*$', stripped) and len(stripped) < 20:
            continue
        if re.match(r'^@[A-Za-z0-9_]+$', stripped):
            continue
        
        # 跳过日期时间行
        if re.match(r'^\w+\s+\d{1,2}$', stripped):  # "Jul 31" "Aug 2"
            continue
        if re.match(r'^\d{1,2}:\d{2}\s*(AM|PM)', stripped, re.IGNORECASE):
            continue
        
        # 跳过互动数据行（纯数字如 5, 8, 1.3K）
        if re.match(r'^[\d,.]+[KMB]?$', stripped) and len(stripped) < 10:
            continue
        
        # 跳过常见推文 UI 文字
        if stripped in ['Views', 'Made with AI', 'Made with Gemini', 'Show more', '显示更多', 'View replies', '查看回复', '回复']:
            continue
        
        # 跳过 "提示词Prompt：" 标记行（保留内容，只跳过标记）
        if re.match(r'^提示词\s*Prompt[：:]?\s*$', stripped):
            continue
        
        # 跳过 @创建图片 命令标记（GPT 的中文命令）
        if stripped.startswith('@创建图片') or stripped.startswith('@Create image'):
            continue
        
        clean_lines.append(line)
    
    prompt = '\n'.join(clean_lines)
    
    # 移除末尾的多余空行和空白
    prompt = re.sub(r'\n{3,}', '\n\n', prompt)
    prompt = prompt.strip()
    
    # 如果 prompt 包含中英文混合，尝试找到真正的 prompt 边界
    # 很多中文作者会在 prompt 后面加推文正文
    # 检测模式：prompt 结束后跟着 "作者名\n@handle\n日期"
    boundary_patterns = [
        r'\n[A-Z][a-z]+\s+[A-Z][a-z]+\s*\n@',  # 英文名+@handle
        r'\n[\u4e00-\u9fff]{2,5}\s*\n@',  # 中文名+@handle
        r'\n\d+\s*\n\d+\s*\n[\d,.]+[KMB]?\s*$',  # 互动数据 5\n8\n1.3K
    ]
    for pattern in boundary_patterns:
        match = re.search(pattern, prompt)
        if match:
            prompt = prompt[:match.start()].strip()
    
    # 最终清理：移除所有残留的 @handle
    prompt = re.sub(r'@[A-Za-z0-9_]+', '', prompt)
    
    # 移除所有残留的日期格式
    prompt = re.sub(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b', '', prompt)
    
    return prompt.strip()

# ====== 去重检查（基于 slug，不是文件名） ======
def is_duplicate(tweet_id):
    """检查 slug 是否已存在（文件名可能不同）"""
    try:
        from scripts.supabase_utils import get_prompt_by_tweet_id
        return get_prompt_by_tweet_id(tweet_id) is not None
    except Exception:
        pass
    # 降级：检查 markdown 文件
    slug = f"prompt-{tweet_id}"
    prompts_dir = Path('content/prompts')
    for md_file in prompts_dir.rglob('*.md'):
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if f'slug: "{slug}"' in content or f"slug: '{slug}'" in content:
            return True
        if f'slug: {slug}' in content:
            return True
    return False

# ====== 8维度评分 ======
def score_8_dimensions(prompt_text, images):
    """8维度评分"""
    text = prompt_text.lower()
    scores = {
        'composition': 6, 'color': 6, 'lighting': 6, 'detail': 6,
        'creativity': 6, 'technical': 6, 'aesthetic': 6, 'curation': 6
    }
    
    keyword_map = {
        'composition': {
            'symmetry': 2, '对称': 2, 'rule of thirds': 2, '三分法': 2,
            'close-up': 1.5, '特写': 1.5, 'wide angle': 1.5, '广角': 1.5,
            'composition': 2, '构图': 2, 'framing': 1.5, 'balance': 1.5
        },
        'color': {
            'color palette': 2, '色彩': 2, 'muted': 1.5, '柔和': 1.5,
            'vibrant': 1.5, '鲜艳': 1.5, 'pastel': 1.5, '粉彩': 1.5,
            'monochrome': 1.5, '单色': 1.5, 'earth tones': 1.5, '大地色': 1.5
        },
        'lighting': {
            'cinematic lighting': 2.5, '电影光': 2.5, 'dramatic light': 2.5,
            'soft light': 2, '柔光': 2, 'backlight': 2, '背光': 2,
            'volumetric': 2, '体积光': 2, 'natural light': 1.5, '自然光': 1.5
        },
        'detail': {
            'detailed': 2, '细节': 2, 'intricate': 2, '精致': 2,
            'highly detailed': 2.5, 'ultra detailed': 2.5,
            'texture': 1.5, '纹理': 1.5, 'realistic': 1.5, '真实': 1.5
        },
        'creativity': {
            'surreal': 2.5, '超现实': 2.5, 'fantasy': 2, '奇幻': 2,
            'conceptual': 2, '概念': 2, 'unique': 2, '独特': 2,
            'innovative': 2, '创新': 2, 'artistic': 2, '艺术': 2
        },
        'technical': {
            '8k': 2, '4k': 1.5, 'high quality': 2, '高质量': 2,
            'professional': 1.5, '专业': 1.5, 'masterpiece': 2.5, '杰作': 2.5,
            'photorealistic': 2.5, 'hyperrealistic': 2.5
        },
        'aesthetic': {
            'elegant': 2, '优雅': 2, 'beautiful': 1.5, '美丽': 1.5,
            'aesthetic': 2, '美学': 2, 'stylish': 1.5, '时尚': 1.5,
            'moody': 1.5, '情绪': 1.5, 'atmospheric': 2, '氛围': 2
        },
        'curation': {
            'editorial': 2.5, '编辑': 2.5, 'fashion': 2, '时尚': 2,
            'magazine': 2.5, '杂志': 2.5, 'campaign': 2, '广告': 2,
            'commercial': 1.5, '商业': 1.5
        }
    }
    
    for dim, keywords in keyword_map.items():
        for kw, points in keywords.items():
            if kw in text:
                scores[dim] += points
    
    # 图片加分
    if images:
        img_bonus = min(len(images) * 0.5, 2)
        for key in scores:
            scores[key] += img_bonus
    
    # 限制最高分10分
    for key in scores:
        scores[key] = min(scores[key], 10)
    
    total = sum(scores.values()) / 8 * 8  # 80分制
    return scores, total

# ====== 中文标题生成（增强版，避免重复，有画面感） ======
def generate_title(prompt_text, tweet=None):
    """生成中文标题（增强版）
    
    手动采集的标题示例：
    - "玻璃瓶里的微缩城市，暖光穿过折射出焦散"
    - "瓶中城 Bottle City — 等距微缩 3D 渲染"
    - "复杂机器剖面图框架"
    - "东方美学PPT课件——字体即图形"
    """
    prompt_lower = prompt_text.lower()
    
    # ====== 风格关键词（含中英文） ======
    style_words = {
        'cinematic': '电影感', '电影感': '电影感',
        'vintage': '复古', '复古': '复古',
        'retro': '怀旧', '怀旧': '怀旧',
        'minimalist': '极简', '极简': '极简',
        'elegant': '优雅', '优雅': '优雅',
        'dramatic': '戏剧性', '戏剧性': '戏剧性',
        'moody': '情绪化', '情绪化': '情绪化',
        'futuristic': '未来', '未来': '未来',
        'sci-fi': '科幻', '科幻': '科幻',
        'cyberpunk': '赛博朋克', '赛博朋克': '赛博朋克',
        'oriental': '东方', '东方': '东方',
        'chinese': '中国风', '中国风': '中国风',
        'japanese': '日式', '日式': '日式',
        'anime': '动漫', '动漫': '动漫',
        'surreal': '超现实', '超现实': '超现实',
        'fantasy': '奇幻', '奇幻': '奇幻',
        'watercolor': '水彩', '水彩': '水彩',
        'ink': '水墨', '水墨': '水墨',
        'steampunk': '蒸汽朋克',
        'gothic': '哥特', '哥特': '哥特',
        'dark': '暗黑', '暗黑': '暗黑',
        'neon': '霓虹', '霓虹': '霓虹',
        'pastel': '粉彩', '粉彩': '粉彩',
        'grainy': '胶片颗粒', '胶片颗粒': '胶片颗粒',
        'noir': '黑色电影',
        'dreamy': '梦幻', '梦幻': '梦幻',
        'ethereal': '空灵', '空灵': '空灵',
        'industrial': '工业', '工业': '工业',
        'brutalist': '粗野主义',
        'art deco': '装饰艺术',
        'art nouveau': '新艺术',
        'bauhaus': '包豪斯',
        'pop art': '波普',
        'pixel': '像素',
        'low poly': '低多边形',
        'isometric': '等距',
        'tilt-shift': '移轴',
        'macro': '微距', '微距': '微距',
        'panoramic': '全景',
        'abstract': '抽象', '抽象': '抽象',
        'geometric': '几何', '几何': '几何',
        'organic': '有机',
        'parametric': '参数化',
        'photorealistic': '超写实', '超写实': '超写实',
        'realistic': '写实', '写实': '写实',
        'editorial': '编辑设计',
        'fashion': '时尚', '时尚': '时尚',
        '仙侠': '仙侠', '古风': '古风',
        '唐风': '唐风', '宋韵': '宋韵',
        '新中式': '新中式', '中式': '中式',
        '赛博': '赛博', 'punk': '朋克',
        '胶片': '胶片', '颗粒': '颗粒',
        '油画': '油画', 'oil painting': '油画',
        '素描': '素描', 'sketch': '素描',
        '版画': '版画', 'print': '版画',
        '浮雕': '浮雕', 'relief': '浮雕',
        '剪纸': '剪纸', 'paper-cut': '剪纸',
        '折纸': '折纸', 'origami': '折纸',
        '粘土': '粘土', 'clay': '粘土',
        '像素': '像素', 'pixel art': '像素艺术',
        '低多边形': '低多边形', 'lowpoly': '低多边形',
        '蒸汽波': '蒸汽波', 'vaporwave': '蒸汽波',
        'lo-fi': '低保真', 'lofi': '低保真',
        '极简主义': '极简主义',
        '表现主义': '表现主义',
        '印象派': '印象派', 'impressionism': '印象派',
        '立体主义': '立体主义', 'cubism': '立体主义',
    }
    
    # ====== 主体/场景关键词（含中英文） ======
    subject_words = {
        'portrait': '人像', '人像': '人像',
        'landscape': '风景', '风景': '风景',
        'cityscape': '城市景观',
        'architecture': '建筑', '建筑': '建筑',
        'nature': '自然', '自然': '自然',
        'character': '角色', '角色': '角色',
        'product': '产品', '产品': '产品',
        'fashion': '时尚',
        'food': '美食', '美食': '美食',
        'poster': '海报', '海报': '海报',
        'illustration': '插画', '插画': '插画',
        '3d': '3D', '3D': '3D',
        'interior': '室内', '室内': '室内',
        'exterior': '室外', '室外': '室外',
        'street': '街景', '街景': '街景',
        'vehicle': '车辆', '车辆': '车辆',
        'animal': '动物', '动物': '动物',
        'plant': '植物', '植物': '植物',
        'robot': '机器人', '机器人': '机器人',
        'mecha': '机甲', '机甲': '机甲',
        'weapon': '武器', '武器': '武器',
        'jewelry': '珠宝', '珠宝': '珠宝',
        'furniture': '家具', '家具': '家具',
        'package': '包装', '包装': '包装',
        'logo': '标志', '标志': '标志',
        'typography': '字体', '字体': '字体',
        'pattern': '图案', '图案': '图案',
        'diorama': '微缩场景', '微缩场景': '微缩场景',
        'miniature': '微缩', '微缩': '微缩',
        'model': '模型', '模型': '模型',
        '人物': '人物', '角色': '角色',
        '女性': '女性', '男性': '男性',
        '少女': '少女', '少年': '少年',
        '儿童': '儿童', '老人': '老人',
        '花卉': '花卉', '花': '花',
        '树': '树', '森林': '森林',
        '山': '山', '海': '海', '河': '河',
        '云': '云', '天空': '天空',
        '月亮': '月亮', '星星': '星星',
        '城市': '城市', '乡村': '乡村',
        '街道': '街道', '小巷': '小巷',
        '房间': '房间', '客厅': '客厅',
        '厨房': '厨房', '卧室': '卧室',
        '办公室': '办公室', '工作室': '工作室',
        '咖啡馆': '咖啡馆', '餐厅': '餐厅',
        '书店': '书店', '图书馆': '图书馆',
        '博物馆': '博物馆', '画廊': '画廊',
        '教堂': '教堂', '寺庙': '寺庙',
        '城堡': '城堡', '宫殿': '宫殿',
        '废墟': '废墟', '遗迹': '遗迹',
        '战场': '战场', '竞技场': '竞技场',
        '太空': '太空', '星球': '星球',
        '飞船': '飞船', '火箭': '火箭',
        '汽车': '汽车', '摩托车': '摩托车',
        '自行车': '自行车', '火车': '火车',
        '飞机': '飞机', '船': '船',
        '猫': '猫', '狗': '狗', '鸟': '鸟',
        '鱼': '鱼', '蝴蝶': '蝴蝶',
        '龙': '龙', '凤凰': '凤凰',
        '独角兽': '独角兽', '精灵': '精灵',
        '天使': '天使', '恶魔': '恶魔',
        '巫师': '巫师', '战士': '战士',
        '公主': '公主', '王子': '王子',
        '女王': '女王', '国王': '国王',
    }
    
    # ====== 材质/质感关键词（含中英文） ======
    material_words = {
        'chrome': '铬金属',
        'brass': '黄铜',
        'copper': '铜',
        'gold': '金',
        'silver': '银',
        'metal': '金属', '金属': '金属',
        'glass': '玻璃', '玻璃': '玻璃',
        'crystal': '水晶', '水晶': '水晶',
        'diamond': '钻石', '钻石': '钻石',
        'wood': '木材', '木材': '木材',
        'bamboo': '竹', '竹': '竹',
        'stone': '石材', '石材': '石材',
        'marble': '大理石', '大理石': '大理石',
        'concrete': '混凝土', '混凝土': '混凝土',
        'brick': '砖', '砖': '砖',
        'leather': '皮革', '皮革': '皮革',
        'silk': '丝绸', '丝绸': '丝绸',
        'velvet': '天鹅绒', '天鹅绒': '天鹅绒',
        'linen': '亚麻', '亚麻': '亚麻',
        'canvas': '帆布', '帆布': '帆布',
        'paper': '纸', '纸': '纸',
        'ceramic': '陶瓷', '陶瓷': '陶瓷',
        'porcelain': '瓷器', '瓷器': '瓷器',
        'clay': '粘土', '粘土': '粘土',
        'resin': '树脂', '树脂': '树脂',
        'plastic': '塑料', '塑料': '塑料',
        'rubber': '橡胶', '橡胶': '橡胶',
        'neon': '霓虹',
        'light': '光',
        'shadow': '影',
        '玉石': '玉石', '玉': '玉',
        '翡翠': '翡翠', 'jade': '翡翠',
        '珍珠': '珍珠', 'pearl': '珍珠',
        '琥珀': '琥珀', 'amber': '琥珀',
        '珊瑚': '珊瑚', 'coral': '珊瑚',
        '贝壳': '贝壳', 'shell': '贝壳',
        '羽毛': '羽毛', 'feather': '羽毛',
        '毛发': '毛发', 'fur': '毛发',
        '鳞片': '鳞片', 'scale': '鳞片',
        '皮革': '皮革',
        '布料': '布料', 'fabric': '布料',
        '蕾丝': '蕾丝', 'lace': '蕾丝',
        '丝绸': '丝绸',
        '棉布': '棉布', 'cotton': '棉布',
        '麻布': '麻布', 'linen': '麻布',
        '羊毛': '羊毛', 'wool': '羊毛',
        '羊绒': '羊绒', 'cashmere': '羊绒',
        '牛仔': '牛仔', 'denim': '牛仔',
        '皮革': '皮革',
        '橡胶': '橡胶',
        '塑料': '塑料',
        '亚克力': '亚克力', 'acrylic': '亚克力',
        '环氧树脂': '环氧树脂', 'epoxy': '环氧树脂',
        '水泥': '水泥', 'cement': '水泥',
        '石膏': '石膏', 'plaster': '石膏',
        '陶土': '陶土', 'terracotta': '陶土',
        '紫砂': '紫砂',
        '青瓷': '青瓷',
        '景泰蓝': '景泰蓝',
        '漆器': '漆器',
        '木雕': '木雕',
        '石雕': '石雕',
        '玉雕': '玉雕',
        '牙雕': '牙雕',
        '竹编': '竹编',
        '草编': '草编',
        '藤编': '藤编',
        '刺绣': '刺绣', 'embroidery': '刺绣',
        '织锦': '织锦',
        '缂丝': '缂丝',
        '剪纸': '剪纸',
        '年画': '年画',
        '皮影': '皮影',
    }
    
    # ====== 光线/氛围关键词（含中英文） ======
    light_words = {
        'golden hour': '黄金时刻',
        'sunset': '日落',
        'sunrise': '日出',
        'backlight': '背光', '背光': '背光',
        'rim light': '轮廓光',
        'soft light': '柔光', '柔光': '柔光',
        'hard light': '硬光', '硬光': '硬光',
        'volumetric': '体积光', '体积光': '体积光',
        'god rays': '上帝光',
        'neon light': '霓虹光',
        'studio light': '影室光',
        'natural light': '自然光', '自然光': '自然光',
        'moonlight': '月光', '月光': '月光',
        'candlelight': '烛光', '烛光': '烛光',
        'firelight': '火光', '火光': '火光',
        'bioluminescent': '生物荧光',
        'aurora': '极光', '极光': '极光',
        '逆光': '逆光',
        '侧光': '侧光',
        '顶光': '顶光',
        '底光': '底光',
        '窗光': '窗光',
        '台灯光': '台灯光',
        '灯光': '灯光',
        '火光': '火光',
        '烛光': '烛光',
        '晨光': '晨光',
        '暮光': '暮光',
        '夕阳光': '夕阳光',
        '朝阳': '朝阳',
        '暖阳': '暖阳',
        '冷光': '冷光',
        '暖光': '暖光',
        '柔光': '柔光',
        '硬光': '硬光',
        '散射光': '散射光',
        '直射光': '直射光',
        '反射光': '反射光',
        '折射光': '折射光',
        '荧光': '荧光',
        '激光': '激光',
        '霓虹': '霓虹',
        '氛围光': '氛围光',
        '环境光': '环境光',
        '全局光照': '全局光照',
        '光线追踪': '光线追踪',
        'ray tracing': '光线追踪',
        'global illumination': '全局光照',
        'ambient occlusion': '环境光遮蔽',
        'bloom': '泛光',
        'glow': '辉光',
        'flare': '光晕',
        'lens flare': '镜头光晕',
        'caustics': '焦散',
        'specular': '高光',
        'diffuse': '漫反射',
    }
    
    # ====== 提取关键词 ======
    found_styles = []
    for eng, chn in style_words.items():
        if eng in prompt_lower:
            found_styles.append(chn)
    
    found_subjects = []
    for eng, chn in subject_words.items():
        if eng in prompt_lower:
            found_subjects.append(chn)
    
    found_materials = []
    for eng, chn in material_words.items():
        if eng in prompt_lower:
            found_materials.append(chn)
    
    found_lights = []
    for eng, chn in light_words.items():
        if eng in prompt_lower:
            found_lights.append(chn)
    
    # ====== 构建标题 ======
    parts = []
    
    # 优先用光线/氛围词
    if found_lights:
        parts.append(found_lights[0])
    
    # 加入材质
    if found_materials:
        parts.append(found_materials[0])
    
    # 加入主体
    if found_subjects:
        parts.append(found_subjects[0])
    
    # 加入风格
    if found_styles:
        parts.append(found_styles[0])
    
    if parts:
        # 取前3个关键词，用"·"连接
        title = '·'.join(parts[:3])
        # 如果不够丰富，加"风格"
        if len(parts) == 1:
            title += '视觉'
    else:
        # Fallback：从分类/场景特征词中提取
        fallback_keywords = {
            'realistic': '写实', 'detailed': '精致细节', 'photorealistic': '超写实',
            'colorful': '缤纷', 'monochrome': '单色', 'black and white': '黑白',
            'warm': '暖调', 'cool': '冷调', 'dark': '暗调',
            'bright': '明亮', 'soft': '柔和', 'sharp': '锐利',
            'dreamscape': '梦境', 'fantasy world': '奇幻世界',
            'futuristic city': '未来城市', 'ancient': '古代',
        }
        fallback_found = [v for k, v in fallback_keywords.items() if k in prompt_lower]
        if fallback_found:
            title = fallback_found[0] + '视觉'
        else:
            # 取提示词前20个字符作为标题
            first_line = prompt_text.strip().split('\n')[0][:20]
            if len(first_line) > 5:
                title = first_line
            else:
                title = 'AI视觉创作'
    
    # 去重：如果标题太长或太短，截断/补充
    if len(title) > 30:
        title = title[:28] + '...'
    elif len(title) < 4:
        title = '视觉创作'
    
    return title

# ====== 分类映射（匹配现有目录结构） ======
def get_category(prompt_text, title):
    """确定分类，匹配现有目录结构"""
    text = prompt_text.lower()
    
    if any(kw in text for kw in ['portrait', 'person', 'character', '人像', '角色']):
        return 'portrait'
    if any(kw in text for kw in ['product', 'commercial', 'brand', '产品', '广告']):
        return 'product'
    if any(kw in text for kw in ['3d', 'render', 'blender', 'c4d', 'octane', '渲染']):
        return '3d'
    if any(kw in text for kw in ['illustration', 'drawing', 'painting', '插画', '绘画']):
        return 'illustration'
    if any(kw in text for kw in ['poster', '海报', 'editorial', '编辑']):
        return 'poster'
    if any(kw in text for kw in ['fashion', 'clothing', 'style', '时尚', '服装']):
        return 'fashion'
    if any(kw in text for kw in ['landscape', 'nature', 'scene', '风景', '自然']):
        return 'landscape'
    
    return 'uncategorized'

# ====== 创建 markdown 文件 ======
def create_markdown(tweet, prompt, title, model, scores, total_score, category):
    """创建 markdown 文件，使用中文标题命名"""
    tweet_id = tweet['id']
    author = tweet.get('author', 'Unknown')
    date = tweet.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    # 生成标签（支持中英文关键词）
    tags = []
    tag_keywords = {
        # 英文 → 中文标签
        'cinematic': '电影感', 'vintage': '复古', 'minimalist': '极简',
        'futuristic': '未来', 'oriental': '东方', 'dramatic': '戏剧性',
        'cyberpunk': '赛博朋克', 'anime': '动漫', 'surreal': '超现实',
        'fantasy': '奇幻', 'watercolor': '水彩', 'ink': '水墨',
        '3d': '3D', 'render': '渲染', 'portrait': '人像',
        'landscape': '风景', 'architecture': '建筑', 'product': '产品',
        'fashion': '时尚', 'poster': '海报', 'illustration': '插画',
        'photorealistic': '超写实', 'realistic': '写实',
        # 中文 → 中文标签（直接匹配）
        '电影感': '电影感', '复古': '复古', '极简': '极简',
        '未来': '未来', '东方': '东方', '戏剧性': '戏剧性',
        '赛博朋克': '赛博朋克', '动漫': '动漫', '超现实': '超现实',
        '奇幻': '奇幻', '水彩': '水彩', '水墨': '水墨',
        '3D': '3D', '渲染': '渲染', '人像': '人像',
        '风景': '风景', '建筑': '建筑', '产品': '产品',
        '时尚': '时尚', '海报': '海报', '插画': '插画',
        '超写实': '超写实', '写实': '写实',
        '古风': '古风', '仙侠': '仙侠', '国风': '国风',
        '新中式': '新中式', '唐风': '唐风', '宋韵': '宋韵',
        '胶片': '胶片', '颗粒': '胶片颗粒',
        '微缩': '微缩', '等距': '等距', '移轴': '移轴',
        '霓虹': '霓虹', '赛博': '赛博',
        '油画': '油画', '素描': '素描', '版画': '版画',
        '浮雕': '浮雕', '剪纸': '剪纸', '折纸': '折纸',
        '粘土': '粘土', '像素': '像素',
        '蒸汽波': '蒸汽波', '低保真': '低保真',
    }
    prompt_lower = prompt.lower()
    for keyword, tag in tag_keywords.items():
        if keyword.lower() in prompt_lower and tag not in tags:
            tags.append(tag)
    # 限制最多 5 个标签
    tags = tags[:5]
    
    content = f"""---
title: "{title}"
slug: "prompt-{tweet_id}"
date: {date}
added: {datetime.now().strftime('%Y-%m-%dT%H:%M:%S.') + str(datetime.now().microsecond).zfill(6)[:3] + '+08:00'}
author: "{author}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
model: "{model}"
cover: "/images/prompts/prompt-{tweet_id}.jpg"
source: "https://x.com/i/status/{tweet_id}"
score: {total_score:.0f}/80
composition: {scores['composition']:.1f}/10
color: {scores['color']:.1f}/10
lighting: {scores['lighting']:.1f}/10
detail: {scores['detail']:.1f}/10
creativity: {scores['creativity']:.1f}/10
technical: {scores['technical']:.1f}/10
aesthetic: {scores['aesthetic']:.1f}/10
curation: {scores['curation']:.1f}/10
---

# {title}

**作者**: {author}  
**日期**: {date}  
**评分**: {total_score:.0f}/80

## 8维度评分

- 构图: {scores['composition']:.1f}/10
- 色彩: {scores['color']:.1f}/10
- 光影: {scores['lighting']:.1f}/10
- 细节: {scores['detail']:.1f}/10
- 创意: {scores['creativity']:.1f}/10
- 技术: {scores['technical']:.1f}/10
- 审美: {scores['aesthetic']:.1f}/10
- 策展: {scores['curation']:.1f}/10

## Prompt

```
{prompt}
```

## 图片

![cover](/images/prompts/prompt-{tweet_id}.jpg)
"""
    
    output_dir = Path(f"content/prompts/{category}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 使用 tweet_id 命名（避免中文标题冲突导致覆盖）
    output_path = output_dir / f"prompt-{tweet_id}.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return output_path

# ====== 主流程 ======
def main():
    print("🔧 开始处理采集到的推文\n")
    
    # 使用 PID 后缀避免竞态条件，同时兼容无 PID 的旧格式
    pid = os.getpid()
    tweets_path = Path(f"/tmp/tweets_batch_{pid}.json")
    if not tweets_path.exists():
        # 兼容旧格式：无 PID 后缀
        alt_path = Path("/tmp/tweets_batch.json")
        if alt_path.exists():
            tweets_path = alt_path
        else:
            print("❌ 未找到采集数据")
            return
    
    with open(tweets_path, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    
    if not tweets:
        print("没有推文需要处理")
        return
    
    print(f"📊 共 {len(tweets)} 条推文待处理\n")
    
    results = {'processed': 0, 'accepted': 0, 'rejected': 0, 'duplicate': 0}
    
    for tweet in tweets:
        tweet_id = tweet['id']
        print(f"\n{'='*60}")
        print(f"处理推文: {tweet_id}")
        print(f"{'='*60}")
        
        try:
            # 去重检查
            if is_duplicate(tweet_id):
                print(f"⏭️  已采集过，跳过")
                results['duplicate'] += 1
                continue
            
            # 提取 prompt（复用成熟技能的多格式提取）
            all_text = tweet.get('allText', '')
            imgs = tweet.get('imgs', [])
            prompt = extract_clean_prompt(all_text, imgs)
            
            if not prompt:
                # 降级：取 ARTICLE 中最长的文本块
                articles = re.findall(r'===ARTICLE \d+===(.*?)(?====ARTICLE|\Z)', all_text, re.DOTALL)
                if articles:
                    prompt = max(articles, key=len).strip()
            
            if not prompt or len(prompt) < 50:
                print("❌ 无法提取prompt或prompt太短")
                results['rejected'] += 1
                continue
            
            print(f"✅ 提取到prompt ({len(prompt)} 字符)")
            
            # 模型识别（复用成熟技能的可信度优先策略）
            model = identify_model(all_text)
            print(f"🤖 模型: {model}")
            
            # 8维度评分
            images = tweet.get('imgs', [])
            scores, total_score = score_8_dimensions(prompt, images)
            print(f"📊 评分: {total_score:.0f}/80")
            print(f"   构图:{scores['composition']:.1f} 色彩:{scores['color']:.1f} 光影:{scores['lighting']:.1f} 细节:{scores['detail']:.1f}")
            print(f"   创意:{scores['creativity']:.1f} 技术:{scores['technical']:.1f} 审美:{scores['aesthetic']:.1f} 策展:{scores['curation']:.1f}")
            
            # 65分以上保留，65分以下加入候选清单
            if total_score < 65:
                print(f"⏭️  评分低于65，加入候选清单")
                # 保存候选（即使低分，方便人工筛选）
                from scripts.auto_collect.save_candidate import save_candidate
                save_candidate(tweet, prompt, title, model, scores, total_score, category)
                results['rejected'] += 1
                continue
            
            # 生成标题
            title = generate_title(prompt, tweet)
            print(f"📝 标题: {title}")
            
            # 确定分类
            category = get_category(prompt, title)
            print(f"📂 分类: {category}")
            
            # 创建 markdown 文件
            md_path = create_markdown(tweet, prompt, title, model, scores, total_score, category)
            print(f"💾 文件: {md_path}")
            
            results['processed'] += 1
            results['accepted'] += 1
        
        except Exception as e:
            print(f"❌ 处理失败: {e}")
            results['rejected'] += 1
            continue
    
    print(f"\n{'='*60}")
    print(f"处理完成")
    print(f"{'='*60}")
    print(f"✅ 已接受: {results['accepted']}")
    print(f"❌ 已拒绝: {results['rejected']}")
    print(f"🔄 已去重: {results['duplicate']}")
    
    if results['accepted'] > 0:
        # Prompt DNA 分析
        print("\n🧬 运行 Prompt DNA 分析...")
        r = subprocess.run(['python3', 'scripts/analyze-prompt-dna.py'], capture_output=True, text=True, timeout=120)
        if r.returncode == 0:
            print("✅ Prompt DNA 分析成功")
        else:
            print(f"⚠️ DNA 分析失败: {r.stderr[:200]}")
        
        # prebuild
        print("\n🔨 运行 prebuild...")
        r = subprocess.run(['npm', 'run', 'prebuild'], capture_output=True, text=True, timeout=120)
        if r.returncode == 0:
            print("✅ prebuild 成功")
        else:
            print(f"❌ prebuild 失败:\n{r.stderr[:300]}")
            return
        
        # 验证文件完整性
        print("\n🔍 验证文件完整性...")
        new_files = list(Path('content/prompts').rglob('prompt-*.md'))
        missing_cover = 0
        for f in new_files[-results['accepted']:]:
            content = f.read_text()
            if 'cover:' not in content:
                print(f"  ⚠️ {f.name} 缺少 cover 字段")
                missing_cover += 1
            if 'source:' not in content:
                print(f"  ⚠️ {f.name} 缺少 source 字段")
        if missing_cover == 0:
            print("  ✅ 所有文件 cover/source 字段完整")
        
        # 提交部署
        print("\n🚀 提交部署...")
        subprocess.run(['git', 'add', '-A'])
        subprocess.run(['git', 'commit', '-m', f'feat: 自动采集 {results["accepted"]} 条提示词 ({datetime.now().strftime("%Y-%m-%d")})'])
        r = subprocess.run(['git', 'push'], capture_output=True, text=True, timeout=30)
        if r.returncode == 0:
            print("✅ 部署成功")
        else:
            print(f"❌ 部署失败:\n{r.stderr[:200]}")

if __name__ == '__main__':
    main()
