#!/usr/bin/env python3
"""
强制同步今天的提示词到 Supabase（只同步表中存在的字段）
"""
import sys
import re
import yaml
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.supabase_utils import get_client

def parse_frontmatter(filepath: Path) -> dict:
    """解析 markdown frontmatter"""
    content = filepath.read_text(encoding='utf-8')
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}
    try:
        return yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError as e:
        print(f'  ⚠️  YAML 解析错误: {e}')
        return {}

def extract_prompt_content(filepath: Path) -> str:
    """提取 Prompt 部分的内容"""
    content = filepath.read_text(encoding='utf-8')
    match = re.search(r'## Prompt\s*\n\n(.*?)(?:\n\n## |\Z)', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def main():
    client = get_client()
    
    # 读取今天的所有 markdown
    today_dir = Path('content/prompts/2026/09/17')
    if not today_dir.exists():
        print(f'❌ 目录不存在: {today_dir}')
        return
    
    files = [f for f in today_dir.iterdir() if f.suffix == '.md']
    print(f'📂 找到 {len(files)} 个 markdown 文件\n')
    
    ok = 0
    fail = 0
    
    for file in sorted(files):
        try:
            fm = parse_frontmatter(file)
            slug = fm.get('slug')
            
            if not slug:
                print(f'⚠️  {file.name}: 缺少 slug')
                fail += 1
                continue
            
            # 构建数据行（只包含 Supabase 表中存在的字段）
            row = {
                'slug': slug,
                'title': fm.get('title', ''),
                'cover': fm.get('cover', ''),
                'images': fm.get('images', []),
                'source': fm.get('source', ''),
                'author': fm.get('author', ''),
                'date': fm.get('date', ''),
                'added': fm.get('added', ''),
                'tags': fm.get('tags', []),
                'model': fm.get('model', ''),
                'category': fm.get('category', ''),
                'prompt': extract_prompt_content(file),
            }
            
            # 处理 authorLink → author_link
            if fm.get('authorLink'):
                row['author_link'] = fm.get('authorLink')
            
            # 强制 upsert
            result = client.table('prompts').upsert(row, on_conflict='slug').execute()
            
            if hasattr(result, 'error') and result.error:
                print(f'❌ {slug}: {result.error}')
                fail += 1
            else:
                print(f'✅ {slug}: {fm.get("title", "")}')
                ok += 1
                
        except Exception as e:
            print(f'❌ {file.name}: {e}')
            fail += 1
    
    print(f'\n{"="*60}')
    print(f'完成: {ok} 成功, {fail} 失败')

if __name__ == '__main__':
    main()
