#!/usr/bin/env python3
"""
修复今天采集的条目评分数据 - 从 markdown frontmatter 读取评分并更新到 Supabase
"""
import sys
import re
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))
import os
os.chdir(str(Path(__file__).parent.parent))

import yaml

# Load env
os.chdir('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')
for line in open('.env.local'):
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        os.environ[k.strip()] = v.strip().strip('"')

from supabase import create_client

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://kxgmtmcspzetyxkhemsw.supabase.co')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
sb = create_client(url, key)

def parse_frontmatter(filepath: Path) -> dict:
    content = filepath.read_text(encoding='utf-8')
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}
    try:
        return yaml.safe_load(match.group(1)) or {}
    except yaml.YamLError as e:
        print(f'  ⚠️  YAML 解析错误: {e}')
        return {}

def main():
    tz = timezone(timedelta(hours=8))
    today = datetime.now(tz)
    today_dir = Path(f'content/prompts/{today.year}/{today.month:02d}/{today.day:02d}')
    
    if not today_dir.exists():
        print(f'❌ 目录不存在: {today_dir}')
        return
    
    files = [f for f in today_dir.iterdir() if f.suffix == '.md']
    print(f'📂 找到 {len(files)} 个 markdown 文件')
    
    ok = 0
    fail = 0
    skip = 0
    
    for file in sorted(files):
        try:
            fm = parse_frontmatter(file)
            slug = fm.get('slug')
            if not slug:
                print(f'⚠️  {file.name}: 缺少 slug')
                fail += 1
                continue
            
            # 检查是否有评分
            score = fm.get('score')
            composition = fm.get('composition')
            
            if score is None and composition is None:
                print(f'⏭️  {slug}: 无评分数据')
                skip += 1
                continue
            
            # 构建更新数据
            update_data = {}
            if score is not None:
                update_data['score'] = int(score)
            if composition is not None:
                update_data['composition'] = int(composition)
            if fm.get('color') is not None:
                update_data['color'] = int(fm['color'])
            if fm.get('lighting') is not None:
                update_data['lighting'] = int(fm['lighting'])
            if fm.get('detail') is not None:
                update_data['detail'] = int(fm['detail'])
            if fm.get('creativity') is not None:
                update_data['creativity'] = int(fm['creativity'])
            if fm.get('technical') is not None:
                update_data['technical'] = int(fm['technical'])
            if fm.get('aesthetic') is not None:
                update_data['aesthetic'] = int(fm['aesthetic'])
            if fm.get('curation') is not None:
                update_data['curation'] = int(fm['curation'])
            
            result = sb.table('prompts').update(update_data).eq('slug', slug).execute()
            
            if result.data:
                print(f'✅ {slug}: score={score}, 8维=[{composition},{fm.get("color")},{fm.get("lighting")},{fm.get("detail")},{fm.get("creativity")},{fm.get("technical")},{fm.get("aesthetic")},{fm.get("curation")}]')
                ok += 1
            else:
                print(f'❌ {slug}: 更新失败')
                fail += 1
                
        except Exception as e:
            print(f'❌ {file.name}: {e}')
            fail += 1
    
    print(f'\n{"="*60}')
    print(f'完成: {ok} 成功, {fail} 失败, {skip} 跳过')

if __name__ == '__main__':
    main()
