#!/usr/bin/env python3
"""
修复过去7天缺失评分的条目
"""
import sys
import re
from pathlib import Path
from datetime import datetime, timedelta, timezone

sys.path.insert(0, str(Path(__file__).parent.parent))
import os
os.chdir('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')

import yaml
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
        return {}

def main():
    tz = timezone(timedelta(hours=8))
    now = datetime.now(tz)
    
    # 查询最近7天无评分的条目
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    result = sb.table('prompts').select('slug,added').gte('added', seven_days_ago).is_('score', 'null').execute()
    no_score_slugs = {d['slug'] for d in (result.data or [])}
    
    print(f'🔍 Supabase 中最近7天无评分: {len(no_score_slugs)} 条')
    
    if not no_score_slugs:
        print('✅ 无需修复')
        return
    
    # 扫描 content/prompts 目录
    content_dir = Path('content/prompts')
    ok = 0
    fail = 0
    not_found = 0
    
    for slug in sorted(no_score_slugs):
        # 查找对应的 markdown 文件
        found = False
        for md_file in content_dir.rglob(f'{slug}.md'):
            fm = parse_frontmatter(md_file)
            score = fm.get('score')
            composition = fm.get('composition')
            
            if score is None and composition is None:
                print(f'⏭️  {slug}: markdown 中也无评分')
                not_found += 1
                found = True
                break
            
            # 构建更新数据
            update_data = {}
            if score is not None:
                update_data['score'] = int(score)
            for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
                if fm.get(dim) is not None:
                    update_data[dim] = int(fm[dim])
            
            result = sb.table('prompts').update(update_data).eq('slug', slug).execute()
            
            if result.data:
                print(f'✅ {slug}: score={score}')
                ok += 1
            else:
                print(f'❌ {slug}: 更新失败')
                fail += 1
            found = True
            break
        
        if not found:
            print(f'⚠️  {slug}: 找不到 markdown 文件')
            not_found += 1
    
    print(f'\n{"="*60}')
    print(f'完成: {ok} 成功, {fail} 失败, {not_found} 未找到')

if __name__ == '__main__':
    main()
