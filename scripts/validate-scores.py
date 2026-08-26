#!/usr/bin/env python3
"""
评分验证脚本
自动检测并修复评分问题：
1. 算术错误（总分 ≠ 维度之和）
2. 全8+违规（所有维度 ≥ 8）
3. 品味匹配不足（与强偏好无关但高分）
"""

import re
import sys
from pathlib import Path
from datetime import datetime

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
IMAGE_TASTE_FILE = WORKDIR / "docs/IMAGE_TASTE.md"
CONTENT_DIR = WORKDIR / "content/prompts"

# 用户的强偏好方向（从 IMAGE_TASTE.md 提取）
STRONG_PREFERENCES = [
    "微缩", "纸艺", "立体书", "等距",
    "东方古风", "仙侠", "电影感",
    "复古未来主义", "太空",
    "工笔", "线描", "矿物色",
    "编辑设计", "排版",
    "旅行", "手绘",
    "自然材质", "奇幻转化",
    "胶片感", "孤独情绪"
]

def parse_taste_table():
    """解析 IMAGE_TASTE.md 的评分表格"""
    if not IMAGE_TASTE_FILE.exists():
        print(f"❌ 找不到 {IMAGE_TASTE_FILE}")
        return []
    
    content = IMAGE_TASTE_FILE.read_text(encoding="utf-8")
    
    # 匹配表格行：| # | 标题 | 作者 | 8个维度 | 总分/80 |
    pattern = re.compile(
        r"\|\s*(\d+)\s*\|"  # 序号
        r"\s*([^|]+)\|"     # 标题
        r"\s*([^|]+)\|"     # 作者
        r"\s*(\d+)\s*\|"    # 构图
        r"\s*(\d+)\s*\|"    # 色彩
        r"\s*(\d+)\s*\|"    # 光影
        r"\s*(\d+)\s*\|"    # 细节
        r"\s*(\d+)\s*\|"    # 创意
        r"\s*(\d+)\s*\|"    # 技术
        r"\s*(\d+)\s*\|"    # 审美
        r"\s*(\d+)\s*\|"    # 策展
        r"\s*([\d.]+)/80"   # 总分
    )
    
    entries = []
    for m in pattern.finditer(content):
        dims = [int(m.group(i)) for i in range(4, 12)]
        entries.append({
            "index": int(m.group(1)),
            "title": m.group(2).strip(),
            "author": m.group(3).strip(),
            "dims": dims,
            "claimed": float(m.group(12)),
            "line_start": m.start(),
            "line_end": m.end(),
            "full_match": m.group(0)
        })
    
    return entries

def check_arithmetic(entry):
    """检查算术是否正确"""
    actual = sum(entry["dims"])
    claimed = entry["claimed"]
    if abs(actual - claimed) > 0.01:
        return False, actual, claimed
    return True, actual, claimed

def check_all_eight_plus(entry):
    """检查是否全8+违规"""
    return all(d >= 8 for d in entry["dims"])

def check_preference_match(entry):
    """检查是否匹配强偏好"""
    title_lower = entry["title"].lower()
    matched = any(pref in title_lower for pref in STRONG_PREFERENCES)
    return matched

def fix_arithmetic_in_file(entry, actual_score):
    """修复 IMAGE_TASTE.md 中的算术错误"""
    content = IMAGE_TASTE_FILE.read_text(encoding="utf-8")
    
    # 替换总分
    old_pattern = re.compile(
        rf"(\|\s*{entry['index']}\s*\|"
        rf"\s*{re.escape(entry['title'])}\|"
        rf"\s*{re.escape(entry['author'])}\|"
        r"(?:\s*\d+\s*\|){8}\s*)"
        rf"[\d.]+/80"
    )
    
    new_text = old_pattern.sub(
        lambda m: m.group(1) + f"{actual_score}/80",
        content
    )
    
    if new_text != content:
        IMAGE_TASTE_FILE.write_text(new_text, encoding="utf-8")
        return True
    return False

def fix_markdown_file(title, actual_score, dims):
    """修复 content/prompts 中的 markdown 文件"""
    # 查找对应的 markdown 文件
    for md_file in CONTENT_DIR.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        if title in content:
            # 更新 score 字段
            lines = content.split("\n")
            new_lines = []
            for line in lines:
                if line.startswith("score:"):
                    new_lines.append(f"score: {actual_score}")
                elif line.startswith("composition:"):
                    new_lines.append(f"composition: {dims[0]}")
                elif line.startswith("color:"):
                    new_lines.append(f"color: {dims[1]}")
                elif line.startswith("lighting:"):
                    new_lines.append(f"lighting: {dims[2]}")
                elif line.startswith("detail:"):
                    new_lines.append(f"detail: {dims[3]}")
                elif line.startswith("creativity:"):
                    new_lines.append(f"creativity: {dims[4]}")
                elif line.startswith("technical:"):
                    new_lines.append(f"technical: {dims[5]}")
                elif line.startswith("aesthetic:"):
                    new_lines.append(f"aesthetic: {dims[6]}")
                elif line.startswith("curation:"):
                    new_lines.append(f"curation: {dims[7]}")
                else:
                    new_lines.append(line)
            
            md_file.write_text("\n".join(new_lines), encoding="utf-8")
            return True
    return False

def main():
    print("=" * 70)
    print("📊 评分质量审计报告")
    print("=" * 70)
    print()
    
    entries = parse_taste_table()
    if not entries:
        print("❌ 没有找到评分数据")
        return
    
    total = len(entries)
    arithmetic_errors = []
    all_eight_plus = []
    preference_mismatch = []
    
    for entry in entries:
        # 检查算术
        is_correct, actual, claimed = check_arithmetic(entry)
        if not is_correct:
            arithmetic_errors.append({
                "entry": entry,
                "actual": actual,
                "claimed": claimed,
                "diff": claimed - actual
            })
        
        # 检查全8+
        if check_all_eight_plus(entry):
            all_eight_plus.append(entry)
        
        # 检查品味匹配
        if not check_preference_match(entry) and entry["claimed"] >= 68:
            preference_mismatch.append(entry)
    
    # 输出报告
    print(f"**总条目数**：{total}")
    print(f"**算术错误**：{len(arithmetic_errors)} 条 ({len(arithmetic_errors)*100//total}%)")
    print(f"**全8+违规**：{len(all_eight_plus)} 条 ({len(all_eight_plus)*100//total}%)")
    print(f"**品味匹配不足（≥68分）**：{len(preference_mismatch)} 条")
    print()
    
    # 算术错误详情
    if arithmetic_errors:
        print("### 算术错误（前10条）")
        for err in arithmetic_errors[:10]:
            e = err["entry"]
            sign = "+" if err["diff"] > 0 else ""
            print(f"- {e['title']} | 维度={e['dims']} | 声称={err['claimed']} | 实际={err['actual']} | 偏差={sign}{err['diff']}")
        print()
    
    # 全8+违规
    if all_eight_plus:
        print("### 全8+违规（前10条）")
        for e in all_eight_plus[:10]:
            print(f"- {e['title']} | {e['claimed']}/80 | 维度={e['dims']}")
        print()
    
    # 品味匹配不足
    if preference_mismatch:
        print("### 品味匹配不足但高分（前10条）")
        for e in preference_mismatch[:10]:
            print(f"- {e['title']} | {e['claimed']}/80")
        print()
    
    # 自动修复
    print("=" * 70)
    print("🔧 开始自动修复")
    print("=" * 70)
    print()
    
    fixed_count = 0
    
    # 修复算术错误
    for err in arithmetic_errors:
        entry = err["entry"]
        actual = err["actual"]
        
        # 修复 IMAGE_TASTE.md
        if fix_arithmetic_in_file(entry, actual):
            print(f"✅ 修复 IMAGE_TASTE.md: {entry['title']} ({err['claimed']}→{actual})")
            fixed_count += 1
        
        # 修复 markdown 文件
        if fix_markdown_file(entry["title"], actual, entry["dims"]):
            print(f"✅ 修复 markdown: {entry['title']}")
    
    print()
    print(f"**修复完成**：{fixed_count} 条")
    print()
    
    # 提交修复
    if fixed_count > 0:
        import subprocess
        subprocess.run([
            "git", "add", "-A"
        ], cwd=WORKDIR)
        subprocess.run([
            "git", "commit", "-m", 
            f"fix: 自动修复 {fixed_count} 条评分算术错误"
        ], cwd=WORKDIR)
        subprocess.run([
            "git", "push", "origin", "main"
        ], cwd=WORKDIR)
        print("✅ 已提交并推送修复")

if __name__ == "__main__":
    main()
