#!/usr/bin/env python3
"""修复 IMAGE_TASTE.md 中的算术错误"""
import re

path = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/docs/IMAGE_TASTE.md"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 匹配表格行
pattern = re.compile(
    r"(\|\s*\d+\s*\|"
    r"\s*[^|]+\|"
    r"\s*[^|]+\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|)\s*([\d.]+)/80"
)

fixes = []
def fix_line(m):
    dims = [int(m.group(i)) for i in range(2, 10)]
    actual = sum(dims)
    claimed = float(m.group(10))
    if abs(actual - claimed) > 0.01:
        title = m.group(0).split("|")[2].strip()
        fixes.append(f"{title}: {claimed}→{actual}")
        return m.group(1) + f" {actual}/80"
    return m.group(0)

new_content = pattern.sub(fix_line, content)

if fixes:
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"✅ 修复 IMAGE_TASTE.md: {len(fixes)} 条")
    for f in fixes[:15]:
        print(f"  - {f}")
else:
    print("无算术错误需要修复")
