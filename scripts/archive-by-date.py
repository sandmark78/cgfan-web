#!/usr/bin/env python3
"""
按日期归档提示词文件

将 content/prompts/ 下的所有 .md 文件移动到日期结构：
  content/prompts/YYYY/MM/DD/filename.md

用法：
  python3 scripts/archive-by-date.py [--dry-run]
"""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
PROMPTS_DIR = WORKDIR / "content/prompts"


def extract_date_from_frontmatter(filepath: Path) -> Optional[datetime]:
    """从 markdown 文件的 frontmatter 中提取日期"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read(2000)  # 只读前2000字符
        
        # 提取 frontmatter
        if not content.startswith('---'):
            return None
        
        end_idx = content.find('---', 3)
        if end_idx == -1:
            return None
        
        frontmatter = content[3:end_idx]
        
        # 优先提取 added 字段（采集时间）
        added_match = re.search(r'^added:\s*["\']?(\d{4}-\d{2}-\d{2})', frontmatter, re.MULTILINE)
        if added_match:
            return datetime.strptime(added_match.group(1), '%Y-%m-%d')
        
        # 其次提取 date 字段
        date_match = re.search(r'^date:\s*["\']?(\d{4}-\d{2}-\d{2})', frontmatter, re.MULTILINE)
        if date_match:
            return datetime.strptime(date_match.group(1), '%Y-%m-%d')
        
        return None
    except Exception as e:
        print(f"⚠️  读取失败 {filepath.name}: {e}")
        return None


def archive_file(filepath: Path, dry_run: bool = False) -> bool:
    """将文件移动到日期归档目录"""
    date = extract_date_from_frontmatter(filepath)
    if not date:
        # 使用文件修改时间
        mtime = filepath.stat().st_mtime
        date = datetime.fromtimestamp(mtime)
    
    # 构建目标路径
    year = date.strftime('%Y')
    month = date.strftime('%m')
    day = date.strftime('%d')
    
    target_dir = PROMPTS_DIR / year / month / day
    target_path = target_dir / filepath.name
    
    # 检查是否已经在正确位置
    if filepath.parent == target_dir:
        return False  # 已经归档
    
    # 检查目标是否已存在
    if target_path.exists():
        print(f"⚠️  目标已存在，跳过: {target_path.relative_to(WORKDIR)}")
        return False
    
    if dry_run:
        print(f"📦 [DRY-RUN] {filepath.relative_to(WORKDIR)} → {target_path.relative_to(WORKDIR)}")
        return True
    
    # 创建目录
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # 移动文件
    shutil.move(str(filepath), str(target_path))
    print(f"✅ {filepath.relative_to(WORKDIR)} → {target_path.relative_to(WORKDIR)}")
    
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description='按日期归档提示词文件')
    parser.add_argument('--dry-run', action='store_true', help='只显示将要执行的操作，不实际移动文件')
    args = parser.parse_args()
    
    print(f"📂 扫描目录: {PROMPTS_DIR.relative_to(WORKDIR)}")
    if args.dry_run:
        print("🔍 DRY-RUN 模式（不实际移动文件）\n")
    
    # 收集所有 .md 文件
    md_files = []
    for root, dirs, files in os.walk(PROMPTS_DIR):
        # 跳过已经归档的目录（YYYY/MM/DD）
        rel_root = Path(root).relative_to(PROMPTS_DIR)
        parts = rel_root.parts
        if len(parts) >= 3 and parts[0].isdigit() and parts[1].isdigit() and parts[2].isdigit():
            continue
        
        for file in files:
            if file.endswith('.md'):
                md_files.append(Path(root) / file)
    
    print(f"找到 {len(md_files)} 个 markdown 文件\n")
    
    # 归档文件
    moved_count = 0
    for filepath in sorted(md_files):
        if archive_file(filepath, dry_run=args.dry_run):
            moved_count += 1
    
    print(f"\n{'='*60}")
    if args.dry_run:
        print(f"📊 [DRY-RUN] 将要移动 {moved_count} 个文件")
    else:
        print(f"✅ 完成！已移动 {moved_count} 个文件")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
