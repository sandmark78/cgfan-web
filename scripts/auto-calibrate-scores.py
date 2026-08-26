#!/usr/bin/env python3
"""
自动校准评分
1. 全8+违规：把最低维度降到7
2. 品味匹配不足的高分（≥68）：降到65-67
"""
import re

path = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/docs/IMAGE_TASTE.md"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 强偏好关键词
STRONG_PREFS = [
    "微缩", "纸艺", "立体书", "等距",
    "东方古风", "仙侠", "电影感",
    "复古未来", "太空",
    "工笔", "线描", "矿物色",
    "编辑设计", "排版",
    "旅行", "手绘",
    "自然材质", "奇幻转化",
    "胶片感", "孤独情绪"
]

# 匹配表格行
pattern = re.compile(
    r"(\|\s*\d+\s*\|"
    r"\s*([^|]+)\|"  # 标题
    r"\s*[^|]+\|"    # 作者
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|"
    r"\s*(\d+)\s*\|)\s*([\d.]+)/80"
)

fixes_8plus = []
fixes_pref = []

def fix_line(m):
    title = m.group(2).strip()
    dims = [int(m.group(i)) for i in range(3, 11)]
    claimed = float(m.group(11))
    
    # 检查是否匹配强偏好
    has_pref = any(p in title for p in STRONG_PREFS)
    
    # 1. 全8+违规修复
    if all(d >= 8 for d in dims):
        # 找到最低的维度，降到7
        min_idx = dims.index(min(dims))
        dims[min_idx] = 7
        fixes_8plus.append(f"{title}: 全8+→维度{min_idx}降为7")
    
    # 2. 品味匹配不足的高分修复
    if not has_pref and sum(dims) >= 68:
        # 把总分降到65-67
        target = 66
        current = sum(dims)
        if current > target:
            # 均匀降低高分维度
            while sum(dims) > target:
                max_idx = dims.index(max(dims))
                if dims[max_idx] > 7:
                    dims[max_idx] -= 1
            fixes_pref.append(f"{title}: {current}→{sum(dims)}（无强偏好）")
    
    # 重新计算总分
    actual = sum(dims)
    
    # 重建行
    return (f"| {m.group(0).split('|')[1]}|{m.group(2)}|{m.group(0).split('|')[3]}|"
            f" {dims[0]} | {dims[1]} | {dims[2]} | {dims[3]} | "
            f"{dims[4]} | {dims[5]} | {dims[6]} | {dims[7]} | {actual}/80")

new_content = pattern.sub(fix_line, content)

if fixes_8plus or fixes_pref:
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print(f"✅ 全8+修复: {len(fixes_8plus)} 条")
    for f in fixes_8plus[:10]:
        print(f"  - {f}")
    
    print(f"\n✅ 品味匹配修复: {len(fixes_pref)} 条")
    for f in fixes_pref[:10]:
        print(f"  - {f}")
else:
    print("无需修复")
