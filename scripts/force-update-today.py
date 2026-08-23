#!/usr/bin/env python3
"""
强制更新今天采集的提示词数据到 Supabase
解决增量同步不更新已存在 slug 的问题
"""
import sys
import re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import yaml
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

def main():
    client = get_client()
    
    # 读取今天的所有 markdown
    today_dir = Path('content/prompts/2026/08/23')
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
            images = fm.get('images', [])
            
            if not slug:
                print(f'⚠️  {file.name}: 缺少 slug')
                fail += 1
                continue
            
            if not images or len(images) <= 1:
                print(f'⏭️  {slug}: 只有1张图，跳过')
                continue
            
            # 强制更新 images 字段
            result = client.table('prompts').update({
                'images': images,
                'cover': fm.get('cover'),
            }).eq('slug', slug).execute()
            
            if hasattr(result, 'error') and result.error:
                print(f'❌ {slug}: {result.error}')
                fail += 1
            else:
                print(f'✅ {slug}: {len(images)} 张图')
                ok += 1
                
        except Exception as e:
            print(f'❌ {file.name}: {e}')
            fail += 1
    
    print(f'\n{"="*60}')
    print(f'完成: {ok} 成功, {fail} 失败')

if __name__ == '__main__':
    main()
