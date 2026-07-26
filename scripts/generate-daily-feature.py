#!/usr/bin/env python3
"""
每日一味自动生成脚本

从最新收录的提示词中选择一个作为今天的每日一味，
自动生成策展笔记并更新 lib/daily-feature.ts

用法：
  python3 scripts/generate-daily-feature.py

逻辑：
  1. 读取 lib/prompts-data.json，找到今天收录的最新提示词
  2. 如果今天已有每日一味数据，跳过
  3. 否则，选择最新的一条，生成策展笔记
  4. 更新 lib/daily-feature.ts
"""

import json
import os
import re
from datetime import datetime, timedelta

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
PROMPTS_DATA = os.path.join(WORKDIR, "lib/prompts-data.json")
DAILY_FEATURE_FILE = os.path.join(WORKDIR, "lib/daily-feature.ts")


def load_prompts():
    """加载所有提示词数据"""
    with open(PROMPTS_DATA, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_daily_features():
    """解析 lib/daily-feature.ts 中的日期列表"""
    with open(DAILY_FEATURE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 提取所有 date: 'YYYY-MM-DD' 行
    dates = re.findall(r"date:\s*'(\d{4}-\d{2}-\d{2})'", content)
    return dates


def generate_curator_note(prompt):
    """根据提示词生成策展笔记"""
    title = prompt.get("title", "")
    category = prompt.get("category", "")
    tags = prompt.get("tags", [])
    model = prompt.get("model", "")

    # 根据分类生成不同的笔记风格
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
        tip = "用具体的艺术运动名称（如 'Art Nouveau'、'Bauhaus'）比 'artistic style' 更有效。"
    elif category == "3d":
        note = f"3D 渲染提示词，展示了如何用 AI 生成逼真的三维场景。"
        tip = "指定渲染引擎（如 'Octane Render'、'V-Ray'）和材质类型会让结果更专业。"
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
    existing_dates = parse_daily_features()

    if today in existing_dates:
        print(f"✅ {today} 已有每日一味数据，跳过")
        return

    # 加载提示词数据
    prompts = load_prompts()

    # 找到今天收录的最新提示词（按 added 字段排序）
    today_prompts = [
        p for p in prompts
        if p.get("added", "").startswith(today)
    ]

    if not today_prompts:
        print(f"⚠️  {today} 没有新收录的提示词，跳过")
        return

    # 选择最新的一条（added 时间最晚的）
    latest = max(today_prompts, key=lambda p: p.get("added", ""))

    print(f"📝 选择提示词：{latest['title']}")
    print(f"   Slug: {latest['slug']}")
    print(f"   分类: {latest.get('category', 'unknown')}")

    # 生成策展笔记
    note, tip, try_change = generate_curator_note(latest)

    # 读取当前的 daily-feature.ts
    with open(DAILY_FEATURE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 构造新的条目
    new_entry = f"""  {{
    date: '{today}',
    slug: '{latest['slug']}',
    curatorNote: '{note}',
    highlight: '{latest['title'][:30]}...',
    technique: '{latest.get('category', 'style')} · AI绘图',
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

    print(f"✅ 已更新 {DAILY_FEATURE_FILE}")
    print(f"   添加了 {today} 的每日一味数据")


if __name__ == "__main__":
    main()
