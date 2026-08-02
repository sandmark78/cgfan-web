#!/usr/bin/env python3
"""
批量修复采集质量问题 v2

修复内容：
1. 清理全文中的 @handle、日期、互动数据
2. 补充缺失的标签（至少3个）
3. 标记质量差的标题（需LLM处理）
"""

import json
import re
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"

# 扩展标签关键词库
TAG_KEYWORDS = {
    '人像': ['portrait', 'person', 'woman', 'man', 'face', '人物', '人像', '女性', '男性', 'girl', 'boy', 'model', 'cosplay', 'coser'],
    '建筑': ['architecture', 'building', 'house', '建筑', '房屋', '室内', 'interior', 'exterior', 'room', 'space'],
    '风景': ['landscape', 'nature', 'mountain', '风景', '自然', '山', 'sea', 'ocean', 'sky', 'forest', 'garden'],
    '产品': ['product', 'object', '物品', '产品', 'bottle', 'perfume', 'packaging', 'brand', 'logo'],
    '海报': ['poster', '海报', 'design', 'typography', 'layout', 'graphic'],
    '时尚': ['fashion', 'clothing', '时尚', '服装', 'dress', 'outfit', 'wear', 'style', 'haute couture'],
    '3D': ['3d', 'render', '三维', '3D', 'blender', 'octane', 'cgi'],
    '插画': ['illustration', 'drawing', '插画', '绘画', 'sketch', 'watercolor', 'ink'],
    '电影感': ['cinematic', '电影感', 'film', 'movie', 'netflix', 'imax'],
    '复古': ['vintage', 'retro', '复古', '怀旧', 'nostalgic', '70s', '80s', '90s'],
    '极简': ['minimalist', '极简', 'simple', 'clean', 'minimal'],
    '赛博朋克': ['cyberpunk', '赛博朋克', 'neon', 'cyber'],
    '科幻': ['sci-fi', '科幻', 'futuristic', 'space', 'alien'],
    '古风': ['古风', 'chinese', '东方', 'oriental', '唐风', '宋', '汉服', '国风'],
    '摄影': ['photography', 'photo', '摄影', '拍摄', 'camera', 'lens', 'shot'],
    '超现实': ['surreal', '超现实', 'dreamlike', 'fantasy'],
    '抽象': ['abstract', '抽象', 'geometric', 'pattern'],
    '动漫': ['anime', '动漫', 'manga', 'cartoon', 'animation'],
    '美食': ['food', '美食', 'dish', 'recipe', 'cooking', 'culinary'],
    '动物': ['animal', '动物', 'cat', 'dog', 'bird', 'pet'],
    '微缩': ['miniature', '微缩', 'tilt-shift', 'tiny', 'small'],
    '粘土': ['clay', '粘土', 'plasticine', 'claymation'],
    '像素': ['pixel', '像素', 'pixel art', '8-bit', '16-bit'],
    '水彩': ['watercolor', '水彩', 'aquarelle'],
    '油画': ['oil painting', '油画', 'canvas'],
    '黑白': ['black and white', '黑白', 'monochrome', 'bw'],
    '霓虹': ['neon', '霓虹', 'glow', 'light'],
    '珠宝': ['jewelry', '珠宝', 'jewel', 'gem', 'diamond', 'ring', 'necklace'],
    '汽车': ['car', '汽车', 'vehicle', 'automobile', 'sports car'],
    '编辑': ['editorial', '编辑', 'magazine', 'cover', 'spread'],
}

def clean_all_text(text):
    """清理文本中的 @handle、日期、互动数据"""
    # 清理 @handle
    text = re.sub(r'@[A-Za-z0-9_]+', '', text)
    
    # 清理日期格式（英文月份+日期）
    text = re.sub(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b', '', text)
    
    # 清理时间格式
    text = re.sub(r'\b\d{1,2}:\d{2}\s*(AM|PM)\b', '', text, flags=re.IGNORECASE)
    
    # 清理互动数据行（纯数字如 5, 8, 1.3K）
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # 跳过纯数字行
        if re.match(r'^[\d,.]+[KMB]?$', stripped) and len(stripped) < 10:
            continue
        # 跳过 "Views" 等UI文字
        if stripped in ['Views', 'Made with AI', 'Made with Gemini', 'Show more', '显示更多']:
            continue
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def extract_tags(text):
    """从文本中提取标签"""
    text_lower = text.lower()
    tags = []
    
    for tag, keywords in TAG_KEYWORDS.items():
        if any(kw.lower() in text_lower for kw in keywords):
            tags.append(tag)
    
    return list(dict.fromkeys(tags))[:5]

def fix_file(md_file):
    """修复单个文件"""
    content = md_file.read_text()
    original = content
    
    # 提取frontmatter
    fm_match = re.match(r'^(---\n.*?\n---\n)', content, re.DOTALL)
    if not fm_match:
        return False, "no frontmatter"
    
    fm_block = fm_match.group(1)
    fm_text = fm_block[4:-4]  # 去掉 ---\n 和 \n---
    rest = content[len(fm_block):]
    
    # 1. 清理全文中的 @handle、日期、互动数据
    rest = clean_all_text(rest)
    
    # 2. 提取并补充标签
    tags_match = re.search(r'tags:\s*\[(.*?)\]', fm_text)
    if tags_match:
        tags_text = tags_match.group(1)
        current_tags = [t.strip().strip('"\'') for t in tags_text.split(',') if t.strip()]
    else:
        current_tags = []
    
    if len(current_tags) < 3:
        # 从全文提取标签
        new_tags = extract_tags(content)
        all_tags = list(dict.fromkeys(current_tags + new_tags))[:5]
        
        if len(all_tags) >= 3:
            # 更新frontmatter中的tags
            new_tags_str = json.dumps(all_tags, ensure_ascii=False)
            if tags_match:
                fm_text = fm_text[:tags_match.start(0)] + f'tags: {new_tags_str}' + fm_text[tags_match.end(0):]
            else:
                # 在category后面插入tags
                fm_text = re.sub(r'(category:\s*.+\n)', f'\\1tags: {new_tags_str}\n', fm_text)
    
    # 重组文件
    new_content = f'---\n{fm_text}\n---\n{rest}'
    
    if new_content != original:
        md_file.write_text(new_content)
        return True, "fixed"
    
    return False, "no change"

def main():
    print("🔧 批量修复采集质量问题 v2...")
    
    prompts_dir = Path(WORKDIR) / "content/prompts"
    fixed_count = 0
    bad_titles = []
    
    for md_file in sorted(prompts_dir.rglob("prompt-*.md")):
        content = md_file.read_text()
        
        # 检查标题质量
        fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if fm_match:
            title_match = re.search(r'title:\s*["\'](.+?)["\']', fm_match.group(1))
            if title_match:
                title = title_match.group(1)
                bad_list = ['AI视觉创作', '创意视觉', '风格海报', '视觉创作']
                if any(b in title for b in bad_list):
                    bad_titles.append((md_file, title))
        
        # 修复文件
        fixed, reason = fix_file(md_file)
        if fixed:
            fixed_count += 1
            print(f"✅ {md_file.name}")
    
    print(f"\n✅ 共修复 {fixed_count} 个文件")
    
    if bad_titles:
        print(f"\n⚠️ {len(bad_titles)} 个文件标题质量差，需要LLM重新生成：")
        for f, title in bad_titles:
            print(f"  - {f.name}: '{title}'")

if __name__ == "__main__":
    main()
