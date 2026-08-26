#!/usr/bin/env python3
"""调试：检查本地 markdown 的 frontmatter 提取"""
import re
from pathlib import Path

project_root = Path(".").resolve()

def extract_from_markdown(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None
    frontmatter = match.group(1)
    data = {}
    for line in frontmatter.split("\n"):
        if ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            data[key] = value
    return data

# 检查今天的一个文件
md_file = Path("content/prompts/2026/08/26/prompt-2092183407778509243.md")
data = extract_from_markdown(md_file)
if data:
    print("文件:", md_file)
    print("slug:", data.get("slug", "N/A"))
    print("authorLink:", data.get("authorLink", "N/A"))
    print("source:", data.get("source", "N/A"))
    print("所有键:", list(data.keys()))
else:
    print("提取失败")

# 统计今天所有文件的 authorLink/source 情况
print("\n=== 今日文件字段检查 ===")
today_dir = Path("content/prompts/2026/08/26")
for f in sorted(today_dir.glob("*.md")):
    d = extract_from_markdown(f)
    if d:
        print(f"{f.name}: authorLink={'有' if d.get('authorLink') else '空'}, source={'有' if d.get('source') else '空'}")