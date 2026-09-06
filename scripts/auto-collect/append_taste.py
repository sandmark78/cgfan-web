#!/usr/bin/env python3
"""
自动将 ≥65 分的采集条目追加到 IMAGE_TASTE.md 的「最喜欢的图片」表格。

美学品味标准：65分（收录标准是58分，两者不同）
- 58分 = 是否收录到网站
- 65分 = 是否加入美学品味记录（每日一味选题池）
"""

import os
import re
from pathlib import Path
from datetime import datetime

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
TASTE_FILE = WORKDIR / "docs" / "IMAGE_TASTE.md"


def append_to_taste(tweet, title, model, score, category):
    """追加一条评分记录到 IMAGE_TASTE.md"""
    if not TASTE_FILE.exists():
        print(f"⚠️  IMAGE_TASTE.md 不存在: {TASTE_FILE}")
        return False
    
    tweet_id = tweet.get('id', 'unknown')
    slug = f"prompt-{tweet_id}"
    source = tweet.get('source', tweet.get('url', ''))
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 读取现有内容
    content = TASTE_FILE.read_text(encoding='utf-8')
    
    # 检查是否已存在（避免重复）
    if slug in content:
        print(f"  ⏭️  {slug} 已在 IMAGE_TASTE.md 中")
        return False
    
    # 找到今天日期的章节，没有则创建
    today_header = f"## {today}"
    if today_header not in content:
        # 在文件末尾追加新的日期章节
        new_section = f"""

{today_header} 自动采集

| 标题 | 分数 | 模型 | 分类 | slug | 备注 |
|------|------|------|------|------|------|
"""
        content += new_section
    
    # 在该日期章节的表格末尾追加新行
    # 找到表格位置，在最后一行 | 之后插入
    lines = content.split('\n')
    insert_idx = None
    
    in_today_section = False
    for i, line in enumerate(lines):
        if today_header in line:
            in_today_section = True
            continue
        if in_today_section:
            if line.startswith('## '):
                # 到了下一个日期章节，在前面插入
                insert_idx = i
                break
            if line.startswith('|') and 'slug' not in line and '---' not in line:
                # 这是表格数据行，继续往后找
                insert_idx = i + 1
            elif line.strip() == '' and insert_idx:
                # 空行，停止
                break
    
    if insert_idx is None:
        # 没找到合适位置，追加到文件末尾
        insert_idx = len(lines)
    
    # 构建表格行
    taste_row = f"| {title} | {score} | {model} | {category} | {slug} | 自动采集 |"
    lines.insert(insert_idx, taste_row)
    
    # 写回文件
    TASTE_FILE.write_text('\n'.join(lines), encoding='utf-8')
    print(f"  ✅ 已追加到 IMAGE_TASTE.md: {title} ({score}分)")
    return True


if __name__ == '__main__':
    # 测试
    test_tweet = {'id': 'test123', 'source': 'https://x.com/test/status/123'}
    append_to_taste(test_tweet, "测试标题", "GPT-Image2", 68, "3d")
    print("测试完成，请检查 IMAGE_TASTE.md")
