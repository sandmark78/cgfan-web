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
    """根据提示词完整内容、标签、结构生成有深度的策展笔记"""
    title = prompt.get("title", "")
    category = prompt.get("category", "")
    tags = prompt.get("tags", [])
    model = prompt.get("model", "")
    prompt_text = prompt.get("prompt", "")[:2000]  # 读更多内容
    prompt_lower = prompt_text.lower()

    # === 1. 从标签中提取核心风格 ===
    style_keywords = {
        "纸雕": "纸雕层叠工艺",
        "东方幻想": "东方幻想世界观",
        "山海经": "山海经神话体系",
        "国风": "国风视觉体系",
        "东方美学": "东方美学体系",
        "复古": "复古质感",
        "微缩": "微缩工艺",
        "电影感": "电影感叙事",
        "赛博朋克": "赛博朋克美学",
        "极简": "极简主义",
        "水墨": "水墨技法",
        "胶片": "胶片质感",
        "3D": "3D渲染",
        "插画": "插画风格",
        "海报": "海报排版",
        "建筑": "建筑渲染",
        "产品": "产品摄影",
        "时尚": "时尚摄影",
        "人像": "人像摄影",
        "科幻": "科幻概念",
    }
    core_styles = []
    for tag in tags:
        if tag in style_keywords:
            core_styles.append(style_keywords[tag])
        elif "东方" in tag or "中国" in tag or "国风" in tag:
            core_styles.append("东方美学")

    # === 2. 从prompt内容中提取关键技法 ===
    technique_patterns = [
        ("纸雕/纸艺层叠", "纸雕" in prompt_text or "纸艺" in prompt_text or "剪纸" in prompt_text),
        ("立体切纸边缘", "切纸" in prompt_text or "纸边缘" in prompt_text),
        ("压纹纸张质感", "压纹" in prompt_text or "纸张质感" in prompt_text),
        ("浮雕阴影", "浮雕" in prompt_text or "阴影" in prompt_text),
        ("中轴对称构图", "中轴线" in prompt_text or "对称" in prompt_text or "中心汇聚" in prompt_text),
        ("圆形视觉焦点", "圆月" in prompt_text or "圆形" in prompt_text or "圆光" in prompt_text or "日轮" in prompt_text),
        ("纵深感通道", "纵深感" in prompt_text or "通道" in prompt_text or "台阶" in prompt_text or "长街" in prompt_text),
        ("书法字体排版", "书法" in prompt_text or "主标题" in prompt_text or "字体" in prompt_text),
        ("层叠建筑群", "层层叠叠" in prompt_text or "楼阁" in prompt_text or "塔楼" in prompt_text or "廊桥" in prompt_text),
        ("克制色系", "克制" in prompt_text or "深蓝" in prompt_text or "朱砂红" in prompt_text or "暖金" in prompt_text),
        ("版面层级设计", "排版" in prompt_text or "标题区" in prompt_text or "副标题" in prompt_text),
        ("cinematic lighting", "cinematic lighting" in prompt_lower),
        ("体积光", "体积光" in prompt_text or "volumetric" in prompt_lower),
        ("景深控制", "depth of field" in prompt_lower or "景深" in prompt_text or "bokeh" in prompt_lower),
        ("胶片颗粒", "grain" in prompt_lower or "胶片" in prompt_text or "film look" in prompt_lower),
        ("微距摄影", "macro" in prompt_lower or "微距" in prompt_text),
        ("移轴效果", "tilt-shift" in prompt_lower or "移轴" in prompt_text),
    ]
    techniques = [name for name, found in technique_patterns if found]

    # === 3. 构建策展笔记 ===
    note_parts = []

    # 第一句：总体定位
    if core_styles:
        styles_str = " + ".join(core_styles[:3])
        note_parts.append(f"这是一套融合「{styles_str}」的完整提示词框架。")

    # 第二句：核心技法
    if techniques:
        tech_str = "、".join(techniques[:4])
        note_parts.append(f"核心技法：{tech_str}。")

    # 第三句：结构亮点（从prompt中提取关键段落）
    if "【整体构图】" in prompt_text:
        note_parts.append("提示词按构图→场景→风格→色彩→文字五层递进，结构清晰，可复用性强。")
    elif "【构图" in prompt_text:
        note_parts.append("提示词按模块化结构编排，每一层都可独立替换。")

    # 第四句：模型
    if model and model != "通用 Prompt":
        note_parts.append(f"实测 {model} 可稳定输出，适合作为海报类提示词的基准模板。")

    note = " ".join(note_parts) if note_parts else f"这个提示词展示了 AI 图像生成的创意可能性。"

    # === 4. 生成亮点（基于实际内容） ===
    if core_styles:
        highlight = f"{' · '.join(core_styles[:2])} · {title[:20]}"
    else:
        highlight = title[:30]

    # === 5. 生成技法标签 ===
    if techniques:
        technique = " · ".join(techniques[:3])
    elif tags:
        technique = " · ".join(tags[:3])
    else:
        technique = f"{category} · AI绘图"

    # === 6. 生成实用技巧（基于实际prompt结构） ===
    if "【整体构图】" in prompt_text:
        tip = "用「【】」分段标记（如【整体构图】【色彩】）能大幅提升 AI 对复杂提示词的结构理解。"
    elif "--ar" in prompt_text:
        tip = "在提示词中明确比例（--ar 3:4）比后期裁切更稳定，尤其适合竖版海报。"
    elif "纸雕" in prompt_text or "纸艺" in prompt_text:
        tip = "「纸雕」「层叠」「压纹」等材质词需要配合「阴影」「浮雕」才能生成真实的手工质感。"
    elif "volumetric" in prompt_lower or "体积光" in prompt_text:
        tip = "「volumetric lighting」配合「backlight」能产生戏剧性的光束穿透效果，适合氛围感场景。"
    else:
        tip = "用「'」或「【】」做段落分隔，比用换行符更容易让 AI 理解层级关系。"

    # === 7. 生成「试着改一个词」（基于实际内容） ===
    if "深蓝" in prompt_text and "暖金" in prompt_text:
        try_change = "把「深蓝+暖金」改成「墨绿+银灰」，从东方神话转向神秘森林氛围。"
    elif "纸雕" in prompt_text:
        try_change = "把「纸雕」换成「金属蚀刻」，材质从纸艺转向工业风，视觉完全重构。"
    elif "--ar" in prompt_text:
        try_change = "试着改 --ar 比例，从 3:4 改成 16:9，构图重心从竖向叙事转向横向全景。"
    elif "cinematic" in prompt_lower:
        try_change = "把「cinematic lighting」换成「neon noir lighting」，从电影感转向赛博朋克。"
    else:
        try_change = "把核心材质词换掉（如纸张→金属、布料→玻璃），观察材质对氛围的决定性影响。"

    return note, highlight, technique, tip, try_change


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
    note, highlight, technique, tip, try_change = generate_curator_note(selected, favorites)

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
    highlight: '{escape_ts(highlight)}',
    technique: '{escape_ts(technique)}',
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
