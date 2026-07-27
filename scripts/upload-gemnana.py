#!/usr/bin/env python3
"""
Gemnana 批量上传脚本
每次处理10条，持续进行，每100条汇报一次
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path

# 路径配置
BASE_DIR = Path(__file__).parent.parent
GEMNANA_DATA = BASE_DIR / "gemnana-data"
PARSED_FILE = GEMNANA_DATA / "parsed.json"
SCORES_FILE = GEMNANA_DATA / "scores.json"
PROGRESS_FILE = GEMNANA_DATA / "upload_progress.json"
PROMPTS_DIR = BASE_DIR / "content" / "prompts" / "gemnana"
IMAGES_DIR = BASE_DIR / "public" / "images" / "prompts"

# 确保目录存在
PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_uploaded_ids():
    """获取已上传的 gemnana ID"""
    uploaded = set()
    if PROMPTS_DIR.exists():
        for f in PROMPTS_DIR.glob("gemnana-*.md"):
            # gemnana-5.md -> 5
            num = f.stem.replace('gemnana-', '')
            uploaded.add(num)
    return uploaded


def get_progress():
    """加载上传进度"""
    if PROGRESS_FILE.exists():
        return load_json(PROGRESS_FILE)
    return {
        "uploaded": [],
        "total_uploaded": 0,
        "last_report": 0
    }


def save_progress(progress):
    """保存上传进度"""
    save_json(PROGRESS_FILE, progress)


def infer_category(tags):
    """从 tags 推断 category"""
    if not tags:
        return "style"
    
    tags_lower = [t.lower() for t in tags]
    
    if any(t in tags_lower for t in ["人像", "人物", "portrait"]):
        return "portrait"
    elif any(t in tags_lower for t in ["3d", "渲染", "建模"]):
        return "3d"
    elif any(t in tags_lower for t in ["摄影", "photography"]):
        return "photography"
    elif any(t in tags_lower for t in ["设计", "平面", "graphic"]):
        return "design"
    else:
        return "style"


def infer_difficulty(prompt_length):
    """根据 prompt 长度推断难度"""
    if prompt_length < 100:
        return "beginner"
    elif prompt_length < 300:
        return "intermediate"
    else:
        return "advanced"


def generate_markdown(item, score):
    """生成 markdown 文件内容"""
    prompt = item.get('chinese_prompt') or item.get('english_prompt') or ""
    
    # 清理 prompt 中的 HTML 标签
    import re
    prompt = re.sub(r'<[^>]+>', '', prompt)
    
    # 推断字段
    category = infer_category(item.get('tags', []))
    difficulty = infer_difficulty(len(prompt))
    tags = item.get('tags', []) or ["AI绘图", "提示词"]
    
    # 确保有基础标签
    if "AI绘图" not in tags:
        tags.insert(0, "AI绘图")
    if "提示词" not in tags:
        tags.insert(0, "提示词")
    
    # 生成 frontmatter
    frontmatter = f"""---
title: "{item['title']}"
slug: gemnana-{item['id']}
date: {item['date']}
added: {datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}+08:00
model: {item.get('model', 'Common')}
category: {category}
tags:
"""
    for tag in tags[:5]:  # 最多5个标签
        frontmatter += f"  - {tag}\n"
    
    # 作者信息
    author = item.get('source', '') or ''
    author_link = item.get('source_link', '') or ''
    
    frontmatter += f"""difficulty: {difficulty}
source: "{author}"
sourceLink: "{author_link}"
cover: /images/prompts/gemnana-{item['id']}.jpg
---

## Prompt

{prompt}

## 美学评分

- 平均分: {score['avg']:.1f}
- 推荐: {'是' if score.get('recommend') else '否'}
"""
    
    return frontmatter


def upload_batch(batch_size=10):
    """上传一批数据"""
    # 加载数据
    parsed = load_json(PARSED_FILE)
    scores = load_json(SCORES_FILE)
    progress = get_progress()
    
    # 已上传的 ID
    uploaded = get_uploaded_ids()
    uploaded.update(progress["uploaded"])
    
    # 筛选待上传
    candidates = []
    for item in parsed:
        item_id = item['id']
        
        # 跳过已上传
        if item_id in uploaded:
            continue
        
        # 跳过未通过评分
        if item_id not in scores:
            continue
        
        score = scores[item_id]
        if score.get('avg', 0) < 8:
            continue
        
        # 跳过无效 prompt
        prompt = item.get('chinese_prompt') or item.get('english_prompt') or ""
        if '暂无可展示' in prompt or len(prompt.strip()) < 50:
            continue
        
        candidates.append(item)
    
    if not candidates:
        print("✅ 所有符合条件的数据已上传完毕！")
        return 0
    
    # 取前 batch_size 条
    batch = candidates[:batch_size]
    uploaded_this_batch = []
    
    print(f"\n📦 开始上传第 {progress['total_uploaded'] + 1}-{progress['total_uploaded'] + len(batch)} 条...")
    
    for item in batch:
        item_id = item['id']
        score = scores[item_id]
        
        # 生成 markdown
        md_content = generate_markdown(item, score)
        md_path = PROMPTS_DIR / f"gemnana-{item_id}.md"
        md_path.write_text(md_content, encoding='utf-8')
        
        # 复制图片
        img_src = GEMNANA_DATA / "images" / f"{item_id}.jpg"
        img_dst = IMAGES_DIR / f"gemnana-{item_id}.jpg"
        
        if img_src.exists():
            shutil.copy2(img_src, img_dst)
        else:
            print(f"⚠️  图片不存在: {img_src}")
        
        uploaded_this_batch.append(item_id)
        print(f"✅ gemnana-{item_id}: {item['title']}")
    
    # 更新进度
    progress["uploaded"].extend(uploaded_this_batch)
    progress["total_uploaded"] += len(uploaded_this_batch)
    save_progress(progress)
    
    # 每100条汇报
    if progress["total_uploaded"] - progress["last_report"] >= 100:
        print(f"\n📊 进度汇报：已上传 {progress['total_uploaded']} 条")
        progress["last_report"] = progress["total_uploaded"]
        save_progress(progress)
    
    return len(uploaded_this_batch)


if __name__ == "__main__":
    count = upload_batch(10)
    if count > 0:
        print(f"\n✅ 本次上传 {count} 条，记得 git commit & push！")
    elif count == 0:
        print("\n🎉 所有数据已上传完毕！")
