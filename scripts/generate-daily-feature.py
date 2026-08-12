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
    """加载所有提示词数据（优先从 Supabase 读取，降级到 Base64 文件）"""
    try:
        sys.path.insert(0, WORKDIR)
        from scripts.supabase_utils import get_all_prompts
        prompts = get_all_prompts()
        if prompts:
            return prompts
    except Exception as e:
        print(f"⚠️ Supabase 读取失败，降级到文件: {e}")
    
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


def enrich_prompts_with_scores(prompts):
    """从 markdown 文件中读取 score 字段并补充到 prompts 数据中"""
    prompts_dir = os.path.join(WORKDIR, "content/prompts")
    
    # 构建 slug -> prompt 映射
    slug_map = {p.get("slug"): p for p in prompts}
    
    # 遍历所有 markdown 文件
    for category in os.listdir(prompts_dir):
        category_path = os.path.join(prompts_dir, category)
        if not os.path.isdir(category_path):
            continue
        
        for filename in os.listdir(category_path):
            if not filename.endswith('.md'):
                continue
            
            filepath = os.path.join(category_path, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                md_content = f.read()
            
            # 提取 frontmatter
            fm_match = re.match(r'^---\n(.*?)\n---', md_content, re.DOTALL)
            if not fm_match:
                continue
            
            frontmatter = fm_match.group(1)
            
            # 提取 slug
            slug_match = re.search(r'slug:\s*["\x27]?([^"\x27\n]+)["\x27]?', frontmatter)
            if not slug_match:
                continue
            slug = slug_match.group(1).strip()
            
            # 提取 score
            score_match = re.search(r'score:\s*(\d+)', frontmatter)
            if not score_match:
                continue
            score = int(score_match.group(1))
            
            # 更新 prompt 数据
            if slug in slug_map:
                slug_map[slug]['score'] = score


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
    for idx, (title, author, score) in enumerate(matches):
        favorites.append({
            "title": title.strip(),
            "author": author.strip(),
            "score": float(score),
            "index": idx,  # 原始编号，用于同分排序
        })

    # 按分数降序排序；分数相同时，编号靠后的优先（最近加入的）
    favorites.sort(key=lambda x: (x["score"], x["index"]), reverse=True)
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
    """调用 LLM 分析完整 prompt 内容，生成有深度的策展笔记"""
    import requests
    import yaml

    # 读取 API 配置
    with open(os.path.expanduser("~/.hermes/profiles/cgfan/config.yaml"), "r") as f:
        config = yaml.safe_load(f)
    provider = config["providers"]["sensenova"]
    api_key = provider["api_key"]
    base_url = provider["base_url"]
    model = provider["model"]

    title = prompt.get("title", "")
    category = prompt.get("category", "")
    tags = prompt.get("tags", [])
    model_name = prompt.get("model", "通用 Prompt")
    prompt_text = prompt.get("prompt", "")[:3000]
    slug = prompt.get("slug", "")

    # 构建 LLM 分析 prompt
    llm_prompt = f"""你是一位专业的 AI 提示词策展人。分析下面这条提示词，生成当日推荐的策展内容。

## 提示词信息
- 标题：{title}
- 分类：{category}
- 标签：{', '.join(tags)}
- 模型：{model_name}
- slug：{slug}

## 提示词完整内容
{prompt_text}

## 输出要求
以 JSON 格式输出，包含以下字段：

1. **curatorNote**（100-150字）：策展笔记，读起来像资深编辑的推荐语。分析这个 prompt 的独特之处——结构设计、风格创新、技法亮点、适用场景。不要模板化套话，要有具体洞察。

2. **highlight**（20-30字）：一句话亮点，吸引人的精华摘要。

3. **technique**（20-40字）：关键技法标签，用「 · 」分隔，如「纸雕层叠 · 中轴对称构图 · 克制色系」。

4. **tip**（30-50字）：一个实用的提示词写作技巧，基于这个 prompt 的结构特点来写。

5. **tryChange**（30-50字）：「试着改一个词」建议，具体到可操作的方向，比如换材质、换光效、换色系。

## 输出格式
```json
{{
  "curatorNote": "...",
  "highlight": "...",
  "technique": "...",
  "tip": "...",
  "tryChange": "..."
}}
```

注意：curatorNote 控制在 100-150 字，其他字段简洁有力。不要用「这是一套融合」「这是一款」等模板开头，直接进入分析。"""

    # 调用 API
    try:
        resp = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": llm_prompt}],
                "temperature": 0.7,
                "max_tokens": 1000,
            },
            timeout=30,
        )
        resp.raise_for_status()
        result = resp.json()
        content = result["choices"][0]["message"]["content"]

        # 提取 JSON
        import json as json_lib
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            parsed = json_lib.loads(json_match.group(1))
        else:
            # 尝试直接解析
            parsed = json_lib.loads(content)

        note = parsed.get("curatorNote", title)
        highlight = parsed.get("highlight", title[:30])
        technique = parsed.get("technique", " · ".join(tags[:3]))
        tip = parsed.get("tip", "好的提示词结构让 AI 更容易理解你的意图。")
        try_change = parsed.get("tryChange", "试试换一个核心材质词，观察氛围变化。")

        print(f"  📝 LLM 生成策展笔记成功")
        return note, highlight, technique, tip, try_change, False

    except Exception as e:
        print(f"  ⚠️ LLM 调用失败: {e}")
        # fallback: 基于标签生成（但标记为需要人工审核）
        tag_str = " · ".join(tags[:3]) if tags else category
        note = f"这是一个 {tag_str} 方向的提示词，包含完整的场景描述和风格控制。"
        highlight = title[:30]
        technique = tag_str
        tip = "用具体的材质词和光线描述替代笼统形容词，能显著提升输出质量。"
        try_change = "试着替换核心材质词，观察同一结构下的风格变化。"
        print(f"  ⚠️ 使用 fallback 内容，建议人工审核")
        return note, highlight, technique, tip, try_change, True  # 第6个返回值标记是否为 fallback

    return note, highlight, technique, tip, try_change, False  # 正常返回


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
    enrich_prompts_with_scores(prompts)

    # 解析品味画像中的"最喜欢"列表
    favorites = parse_favorite_images()
    print(f"📊 从品味画像中找到 {len(favorites)} 张'最喜欢'图片")

    # === 选题逻辑（从最喜欢列表选） ===
    # 优先级：
    # 1. 用户确认的"最喜欢"（未使用过）
    # 2. 品味画像中的高分图（未使用过）
    # 3. 最新收录的未使用 prompt（fallback）

    selected = None
    selection_reason = ""

    # 解析用户确认的"最喜欢"
    user_confirmed_titles = parse_user_confirmed_favorites()
    print(f"📊 用户确认最喜欢：{len(user_confirmed_titles)} 张")

    # 优先级 1: 用户确认的"最喜欢"（未使用过）
    print(f"🔍 从用户最喜欢列表中查找...")
    for fav in favorites:  # favorites 已按分数降序
        if fav["title"] in user_confirmed_titles:
            slug = find_slug_by_title(prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in prompts if p.get("slug") == slug), None)
                if selected:
                    selection_reason = f"用户最喜欢（{fav['score']}/80）+ 未使用"
                    break

    # 优先级 2: 品味画像中的高分图（未使用过）
    if not selected:
        print(f"🔍 从高分列表中查找...")
        for fav in favorites:
            slug = find_slug_by_title(prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in prompts if p.get("slug") == slug), None)
                if selected:
                    selection_reason = f"高分图（{fav['score']}/80）+ 未使用"
                    break

    # 优先级 3: 过去的最喜欢的（未使用过）
    if not selected:
        print(f"🔍 从用户最喜欢列表中查找...")
        for fav in favorites:  # favorites 已按分数降序
            if fav["title"] in user_confirmed_titles:
                slug = find_slug_by_title(prompts, fav["title"])
                if slug and slug not in existing_slugs:
                    selected = next((p for p in prompts if p.get("slug") == slug), None)
                    if selected:
                        selection_reason = f"用户最喜欢（{fav['score']}/80）+ 未使用"
                        break

    # 优先级 4: 过去的最高分（未使用过）
    if not selected:
        print(f"🔍 从高分列表中查找...")
        for fav in favorites:
            slug = find_slug_by_title(prompts, fav["title"])
            if slug and slug not in existing_slugs:
                selected = next((p for p in prompts if p.get("slug") == slug), None)
                if selected:
                    selection_reason = f"高分图（{fav['score']}/80）+ 未使用"
                    break

    # 优先级 5: 最新收录的未使用 prompt（fallback）
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
    note, highlight, technique, tip, try_change, is_fallback = generate_curator_note(selected, favorites)
    
    # 校验：如果是 fallback 内容，发出警告并跳过部署
    if is_fallback:
        print(f"\n❌ 策展笔记生成失败，使用 fallback 内容")
        print(f"   建议手动运行脚本或检查 API 配置")
        print(f"   跳过今天的部署，等待人工处理")
        return

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
