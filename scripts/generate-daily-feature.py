#!/usr/bin/env python3
"""
每日一味自动生成脚本（质量优先版）

选题优先级：
1. 今天收录的 + 用户评分高的（从 IMAGE_TASTE.md 的"最喜欢"列表）
2. 历史高分的 + 没用过的（从"最喜欢"列表中找）
3. 最新收录的（fallback）

用法：
  python3 scripts/generate-daily-feature.py
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
PROMPTS_DATA = os.path.join(WORKDIR, "lib/prompts-data.json")
DAILY_FEATURE_FILE = os.path.join(WORKDIR, "lib/daily-feature.ts")
IMAGE_TASTE_FILE = os.path.join(WORKDIR, "docs/IMAGE_TASTE.md")


def load_prompts():
    """加载所有提示词数据"""
    with open(PROMPTS_DATA, "r", encoding="utf-8") as f:
        return json.load(f)


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

    # 提取表格行：| # | 图片 | 作者 | ... | 总分 |
    # 格式：| 1 | AI 小说封面生成框架 | Larus Canus | 9 | 8 | 9 | 8 | 9 | 9 | 9 | 9 | 70/80 |
    table_pattern = r"\|\s*\d+\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|\s*(\d+)/80\s*\|"
    matches = re.findall(table_pattern, content[start:])

    favorites = []
    for title, author, score in matches:
        favorites.append({
            "title": title.strip(),
            "author": author.strip(),
            "score": int(score),
        })

    # 按分数降序排序
    favorites.sort(key=lambda x: x["score"], reverse=True)
    return favorites


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
    """根据提示词和品味画像生成策展笔记"""
    title = prompt.get("title", "")
    category = prompt.get("category", "")
    tags = prompt.get("tags", [])
    model = prompt.get("model", "")

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

    # 根据分类和偏好生成笔记
    if category == "product":
        note = f"这是一个商业产品摄影提示词，展示了如何用 AI 生成专业的品牌视觉。"
        tip = "关键是用具体的材质描述（如 'jewel-like highlights'）而不是笼统的 'high quality'。"
    elif category == "portrait":
        note = f"人像摄影提示词，重点在于光影和情绪的把控。"
        tip = "用 'Rembrandt lighting' 或 'golden hour' 这样的专业术语，比 'beautiful light' 更精准。"
    elif category == "landscape":
        note = f"风景摄影提示词，展示了如何用 AI 捕捉自然的壮丽。"
        tip = "加入 'atmospheric perspective' 和 'depth layers' 让画面更有纵深感。"
    elif category == "style":
        note = f"风格化艺术提示词，探索了独特的视觉语言。"
        if strong_preferences:
            note += f" 这个提示词符合「{'、'.join(strong_preferences)}」的偏好方向。"
        tip = "用具体的艺术运动名称（如 'Art Nouveau'、'Bauhaus'）比 'artistic style' 更有效。"
    elif category == "3d":
        note = f"3D 渲染提示词，展示了如何用 AI 生成逼真的三维场景。"
        tip = "指定渲染引擎（如 'Octane Render'、'V-Ray'）和材质类型会让结果更专业。"
    elif category == "design":
        note = f"设计类提示词，展示了如何用 AI 辅助视觉设计工作流。"
        if "东方" in title:
            note += " 融合东方美学与现代设计体系，字体排版即图形。"
        tip = "具体的设计体系描述（如 'Swiss grid'、'东方留白'）比笼统的 'modern design' 更精准。"
    else:
        note = f"这个提示词展示了 AI 图像生成的创意可能性。"
        tip = "具体的描述比抽象的形容更有效，用 'neon red chaise lounge' 而不是 'colorful furniture'。"

    # 根据标签补充细节
    if "GPT-Image2" in tags:
        note += " 使用 GPT-Image 2 模型生成。"
    elif "Midjourney" in tags:
        note += " 使用 Midjourney 模型生成。"

    # 生成"试着改一个词"
    try_change = "把提示词中的颜色或材质描述换成对比色/对比材质，观察整体氛围的变化。"

    return note, tip, try_change


def main():
    os.chdir(WORKDIR)

    # 检查今天是否已有每日一味
    today = datetime.now().strftime("%Y-%m-%d")
    existing_features = parse_daily_features()  # [(date, slug), ...]
    existing_dates = [d for d, s in existing_features]
    existing_slugs = set(s for d, s in existing_features)

    if today in existing_dates:
        print(f"✅ {today} 已有每日一味数据，跳过")
        return

    # 加载提示词数据
    prompts = load_prompts()

    # 解析品味画像中的"最喜欢"列表
    favorites = parse_favorite_images()
    print(f"📊 从品味画像中找到 {len(favorites)} 张'最喜欢'图片")

    # === 选题逻辑（质量优先） ===

    selected = None
    selection_reason = ""

    # 优先级 1: 今天收录的 + 高分的
    today_prompts = [
        p for p in prompts
        if p.get("added", "").startswith(today)
    ]

    if today_prompts:
        print(f"📝 今天收录了 {len(today_prompts)} 条提示词")

        # 检查今天的是否在"最喜欢"列表中
        for fav in favorites:
            slug = find_slug_by_title(today_prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in today_prompts if p.get("slug") == slug), None)
                selection_reason = f"今天收录 + 高分（{fav['score']}/80）"
                break

        # 如果今天没有高分的，选今天最新的
        if not selected:
            selected = max(today_prompts, key=lambda p: p.get("added", ""))
            selection_reason = "今天收录的最新提示词"

    # 优先级 2: 历史高分的 + 没用过的
    if not selected and favorites:
        print(f"🔍 今天无新收录，从历史高分中查找...")
        for fav in favorites:
            slug = find_slug_by_title(prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in prompts if p.get("slug") == slug), None)
                selection_reason = f"历史高分（{fav['score']}/80）+ 未使用"
                break

    # 优先级 3: 最新收录的（fallback）
    if not selected:
        print(f"⚠️  无高分可用，fallback 到最新收录")
        available = [p for p in prompts if p.get("slug", "") not in existing_slugs]
        if not available:
            print(f"❌ 所有提示词都已用过，跳过")
            return
        selected = max(available, key=lambda p: p.get("added", ""))
        selection_reason = "最新未使用的提示词"

    print(f"\n✅ 选中：{selected['title']}")
    print(f"   Slug: {selected['slug']}")
    print(f"   分类: {selected.get('category', 'unknown')}")
    print(f"   理由: {selection_reason}")

    # 生成策展笔记
    note, tip, try_change = generate_curator_note(selected, favorites)

    # 读取当前的 daily-feature.ts
    with open(DAILY_FEATURE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 构造新的条目
    new_entry = f"""  {{
    date: '{today}',
    slug: '{selected['slug']}',
    curatorNote: '{note}',
    highlight: '{selected['title'][:30]}...',
    technique: '{selected.get('category', 'style')} · AI绘图',
    tip: '{tip}',
    tryChange: '{try_change}',
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
