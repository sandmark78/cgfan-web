#!/usr/bin/env python3
"""
清理 IMAGE_TASTE.md 中低于 65 分的条目。

美学品味标准：65分（收录标准是58分）
低于 65 分的条目应该从「最喜欢的图片」表格中移除。
"""

import re
from pathlib import Path

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
TASTE_FILE = WORKDIR / "docs" / "IMAGE_TASTE.md"


def clean_low_scores():
    """移除低于 65 分的条目"""
    if not TASTE_FILE.exists():
        print(f"❌ 找不到 {TASTE_FILE}")
        return
    
    content = TASTE_FILE.read_text(encoding='utf-8')
    lines = content.split('\n')
    
    cleaned_lines = []
    removed_count = 0
    kept_count = 0
    
    for line in lines:
        # 检查是否是表格数据行（包含 | 和分数）
        if line.startswith('|') and '/' in line:
            # 提取总分（格式如 "65/80" 或 "65.5/80"）
            score_match = re.search(r'(\d+(?:\.\d+)?)/80', line)
            if score_match:
                score = float(score_match.group(1))
                if score < 65:
                    # 提取标题用于日志
                    title_match = re.search(r'\|\s*\d*\s*\|([^|]+)\|', line)
                    title = title_match.group(1).strip() if title_match else "未知"
                    print(f"  ❌ 移除: {title} ({score}分)")
                    removed_count += 1
                    continue
                else:
                    kept_count += 1
        
        cleaned_lines.append(line)
    
    # 写回文件
    TASTE_FILE.write_text('\n'.join(cleaned_lines), encoding='utf-8')
    
    print(f"\n✅ 清理完成")
    print(f"   保留: {kept_count} 条 (≥65分)")
    print(f"   移除: {removed_count} 条 (<65分)")


if __name__ == '__main__':
    print("清理 IMAGE_TASTE.md 中的低分作品...\n")
    clean_low_scores()
