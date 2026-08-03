#!/usr/bin/env python3
"""
每日一味自动生成脚本（品味优先版）

选题优先级：
1. 用户明确说"最喜欢"的图（IMAGE_TASTE.md 中标记「→ 最喜欢」的）
2. AI 评的高分图（IMAGE_TASTE.md 中评分最高的）
3. 历史"最喜欢"中没用过的
4. 历史高分中没用过的
5. 最新收录的（fallback）

用法：
  python3 scripts/generate-daily-feature.py
"""

import json
import os
import re
from datetime import datetime, timedelta
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
PROMPTS_DATA = os.path.join(WORKDIR, "lib/prompts-data.ts")
DAILY_FEATURE_FILE = os.path.join(WORKDIR, "lib/daily-feature.ts")
IMAGE_TASTE_FILE = os.path.join(WORKDIR, "docs/IMAGE_TASTE.md")


def load_prompts():
    """加载所有提示词数据（从 Base64 编码的 TypeScript 文件）"""
    import base64
    with open(PROMPTS_DATA, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 提取 Base64 字符串：export default `...`;
    match = re.search(r'export default `([^`]+)`', content)
    if not match:
        raise ValueError("无法解析 prompts-data.ts 文件")
    
    encoded = match.group(1)
    decoded = base64.b64decode(encoded).decode('utf-8')
    return json.loads(decoded)


def parse_daily_features():
    """解析 lib/daily-feature.ts 中的日期和 slug"""
    with open(DAILY_FEATURE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 提取所有 { date: 'YYYY-MM-DD', slug: 'xxx' } 对
    pattern = r"date:\s*'(\d{4}-\d{2}-\d{2})',\s*slug:\s*'([^']+)'"
    matches = re.findall(pattern, content)
    return matches  # [(date, slug), ...]


def parse_favorite_images():
    """从 IMAGE_TASTE.md 解析"最喜欢"列表（有评分的）"""
    if not os.path.exists(IMAGE_TASTE_FILE):
        print(f"⚠️  找不到 {IMAGE_TASTE_FILE}，跳过品味画像")
        return []

    with open(IMAGE_TASTE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 找到"## 最喜欢的图片"部分
    start = content.find("## 最喜欢的图片")
    if start == -1:
        return []

    # 提取表格行：| # | 图片 | 作者 | 8维度分数 | 总分 |
    # 格式：| 1 | AI 小说封面生成框架 | Larus Canus | 9 | 8 | 9 | 8 | 9 | 9 | 9 | 9 | 70/80 |
    # 总分可能是小数如 68.5/80
    table_pattern = r"\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|(?:[^|]*\|){8}\s*([\d.]+)/80\s*\|"
    matches = re.findall(table_pattern, content[start:])

    favorites = []
    for title, author, score in matches:
        favorites.append({
            "title": title.strip(),
            "author": author.strip(),
            "score": float(score),
        })

    # 按分数降序排序
    favorites.sort(key=lambda x: x["score"], reverse=True)
    return favorites


def parse_user_confirmed_favorites():
    """从 IMAGE_TASTE.md 解析用户明确确认的"最喜欢"图片
    查找多种格式：
    1. ✅ 标题（作者）→ 最喜欢
    2. **最喜欢**：标题
    3. 标题 → 最喜欢，
    """
    if not os.path.exists(IMAGE_TASTE_FILE):
        return set()

    with open(IMAGE_TASTE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    confirmed = set()

    # 格式1：✅ 标题（作者）→ 最喜欢
    # 匹配表格行中的：| - ✅ 标题（作者）→ 最喜欢
    for m in re.finditer(r'✅\s*\*{0,2}([^|（\n]+?)(?:（[^）]+）)?\s*→\s*\*{0,2}最喜欢', content):
        title = m.group(1).strip()
        # 清理：去除序号、星号、引号、管道符
        title = re.sub(r'^\d+号', '', title).strip()
        title = title.strip('*「」| ')
        if title and len(title) > 2:
            confirmed.add(title)

    # 格式2：**最喜欢**：标题（作者）
    for m in re.finditer(r'\*{2}最喜欢\*{2}[：:]\s*(.+?)(?:\n|$)', content):
        title = m.group(1).strip()
        title = re.sub(r'[（(].+?[）)]', '', title).strip()
        title = re.sub(r'^\d+号', '', title).strip()
        title = title.strip('*「」')
        if title:
            confirmed.add(title)

    # 格式3：标题 → 最喜欢，
    for m in re.finditer(r'(?:的|：)\s*(.+?)\s*→\s*最喜欢[，,]', content):
        title = m.group(1).strip()
        title = re.sub(r'[（(].+?[）)]', '', title).strip()
        title = title.strip('*「」')
        if title:
            confirmed.add(title)

    return confirmed


def find_slug_by_title(prompts, title):
    """根据标题找到对应的 slug"""
    # 模糊匹配：标题可能不完全一致
    for p in prompts:
        p_title = p.get("title", "")
        # 完全匹配
        if p_title == title:
            return p.get("slug")
        # 包含匹配（处理标题被截断的情况）
        if title in p_title or p_title in title:
            return p.get("slug")
    return None


def generate_curator_note(prompt, taste_profile):
    """根据提示词和品味画像生成策展笔记（非模板化，基于实际内容）"""
    title = prompt.get("title", "")
    category = prompt.get("category", "")
    tags = prompt.get("tags", [])
    model = prompt.get("model", "")
    prompt_text = prompt.get("prompt", "")[:300]

    # 从品味画像中提取相关偏好
    strong_preferences = []
    if "东方" in title or "东方" in str(tags):
        strong_preferences.append("东方美学")
    if "复古" in title or "复古" in str(tags):
        strong_preferences.append("复古质感")
    if "微缩" in title or "微缩" in str(tags):
        strong_preferences.append("微缩工艺")
    if "电影感" in title or "电影感" in str(tags):
        strong_preferences.append("电影感叙事")

    # 从提示词内容中提取关键技法
    key_techniques = []
    prompt_lower = prompt_text.lower()
    technique_keywords = [
        "cinematic lighting", "体积光", "背光", "柔光", "硬光", "霓虹光",
        "octane render", "v-ray", "blender", "cycles",
        "subsurface scattering", "caustic", "焦散", "折射",
        "tilt-shift", "移轴", "macro", "微距",
        "risograph", "孔版", "丝网",
        "art nouveau", "bauhaus", "swiss", "包豪斯",
        "chinoiserie", "中国风", "东方", "水墨",
        "cyberpunk", "赛博朋克", "synthwave", "outrun",
        "minimalist", "极简", "留白",
        "grain", "胶片", "film look", "kodak", "35mm",
        "depth of field", "景深", "bokeh",
        "volumetric", "体积", "atmospheric",
    ]
    for kw in technique_keywords:
        if kw in prompt_lower:
            key_techniques.append(kw)

    # 收集标签
    tag_str = " · ".join(tags[:3]) if tags else category

    # 根据提示词内容生成具体笔记
    note_parts = []
    
    # 提取主体描述
    subjects = []
    for s in ["portrait", "landscape", "cityscape", "architecture", "product", "character", "still life", "abstract"]:
        if s in prompt_lower:
            subjects.append(s)
    
    if subjects:
        note_parts.append(f"这个 prompt 的核心主体是{'、'.join(subjects)}。")
    
    if key_techniques:
        note_parts.append(f"关键技法：{'、'.join(key_techniques[:3])}。")
    
    if strong_preferences:
        note_parts.append(f"符合「{'、'.join(strong_preferences)}」的偏好方向。")
    
    if model and model != "通用 Prompt":
        note_parts.append(f"使用 {model} 模型。")
    
    note = " ".join(note_parts) if note_parts else f"这个提示词展示了 AI 图像生成的创意可能性。"
    
    # 生成具体技巧（基于提示词内容，非模板）
    if key_techniques:
        tip = f"关键技法「{key_techniques[0]}」是精准控制输出质量的核心词。"
    else:
        tip = "具体的专业术语比笼统的形容词更有效。"
    
    # 生成"试着改一个词"
    if "--ar" in prompt_text:
        try_change = "试着改 --ar 比例，从 16:9 改成 4:3 或 1:1，构图会完全不一样。"
    elif "色彩" in tag_str or "color" in prompt_lower:
        try_change = "把色彩描述词换成对比色系，观察情绪变化。"
    else:
        try_change = "把核心材质或光线词换一个方向，观察整体氛围的变化。"
    
    return note, tip, try_change


def main():
    os.chdir(WORKDIR)

    # 使用北京时间（UTC+8）
    from datetime import timezone, timedelta
    beijing_tz = timezone(timedelta(hours=8))
    now_beijing = datetime.now(beijing_tz)

    # 检查今天是否已有每日一味
    today = now_beijing.strftime("%Y-%m-%d")
    existing_features = parse_daily_features()  # [(date, slug), ...]
    existing_dates = [d for d, s in existing_features]
    existing_slugs = set(s for d, s in existing_features)

    if today in existing_dates:
        print(f"✅ {today} 已有每日一味数据，跳过")
        return

    # 计算昨天的日期（北京时间）
    yesterday = now_beijing - timedelta(days=1)
    yesterday_str = yesterday.strftime("%Y-%m-%d")

    # 加载提示词数据
    prompts = load_prompts()

    # 解析品味画像中的"最喜欢"列表
    favorites = parse_favorite_images()
    print(f"📊 从品味画像中找到 {len(favorites)} 张'最喜欢'图片")

    # === 选题逻辑（品味优先） ===
    # 优先级：用户确认最喜欢 > 高分图 > 历史最喜欢没用过 > 历史高分没用过 > 最新收录

    selected = None
    selection_reason = ""

    # 从"最喜欢"列表中区分：用户确认的 vs 普通高分
    # 用户确认的"最喜欢"：在 IMAGE_TASTE.md 正文中标记了「→ 最喜欢」的
    user_confirmed_titles = parse_user_confirmed_favorites()
    print(f"📊 用户确认最喜欢：{len(user_confirmed_titles)} 张")
    print(f"📊 高分图片（最喜欢列表）：{len(favorites)} 张")

    # 优先级 1: 用户确认"最喜欢"的 + 未使用
    for fav in favorites:  # favorites 已按分数降序
        if fav["title"] in user_confirmed_titles:
            slug = find_slug_by_title(prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in prompts if p.get("slug") == slug), None)
                if selected:
                    selection_reason = f"用户确认最喜欢（{fav['score']}/80）"
                    break

    # 优先级 2: 高分图（最喜欢列表中，按分数降序）+ 未使用
    if not selected:
        print(f"🔍 无可用用户最喜欢，从高分列表中查找...")
        for fav in favorites:
            slug = find_slug_by_title(prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in prompts if p.get("slug") == slug), None)
                if selected:
                    selection_reason = f"高分图（{fav['score']}/80）+ 未使用"
                    break

    # 优先级 3: 最新收录的未使用 prompt（fallback）
    if not selected:
        print(f"🔍 从最新收录中找未使用的...")
        sorted_prompts = sorted(prompts, key=lambda p: p.get("date", ""), reverse=True)
        for p in sorted_prompts:
            if p.get("slug", "") not in existing_slugs:
                selected = p
                selection_reason = f"最新收录 + 未使用"
                break

    if not selected:
        print(f"⚠️ 没有找到有评分的未使用提示词，跳过当天")
        return

    print(f"\n✅ 选中：{selected['title']}")
    print(f"   Slug: {selected['slug']}")
    print(f"   分类: {selected.get('category', 'unknown')}")
    print(f"   理由: {selection_reason}")

    # 生成策展笔记
    note, tip, try_change = generate_curator_note(selected, favorites)

    # 读取当前的 daily-feature.ts
    with open(DAILY_FEATURE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 转义单引号，避免破坏 TypeScript 字符串
    def escape_ts(s):
        return s.replace("'", "\\'").replace('\n', ' ')
    
    # 构造新的条目
    new_entry = f"""  {{
    date: '{today}',
    slug: '{selected['slug']}',
    curatorNote: '{escape_ts(note)}',
    highlight: '{escape_ts(selected['title'][:30])}...',
    technique: '{escape_ts(selected.get('category', 'style'))} · AI绘图',
    tip: '{escape_ts(tip)}',
    tryChange: '{escape_ts(try_change)}',
  }},
"""

    # 插入到数组开头（在 export const dailyFeatures: DailyFeature[] = [ 之后）
    pattern = r"(export const dailyFeatures: DailyFeature\[\] = \[\n)"
    replacement = r"\1" + new_entry

    new_content = re.sub(pattern, replacement, content, count=1)

    # 写回文件
    with open(DAILY_FEATURE_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"\n✅ 已更新 {DAILY_FEATURE_FILE}")
    print(f"   添加了 {today} 的每日一味数据")


if __name__ == "__main__":
    main()
