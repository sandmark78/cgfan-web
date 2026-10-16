#!/usr/bin/env python3
"""修复剩余2条评分（markdown 格式异常导致 YAML 解析失败）"""
import sys, re, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.chdir('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web')

for line in open('.env.local'):
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        os.environ[k.strip()] = v.strip().strip('"')

from supabase import create_client
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://kxgmtmcspzetyxkhemsw.supabase.co')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
sb = create_client(url, key)

SLUGS = ['prompt-2109494618257785262', 'prompt-2109948906264199313']
FIELDS = ['score', 'composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']

for slug in SLUGS:
    for md in Path('content/prompts').rglob(f'{slug}.md'):
        content = md.read_text(encoding='utf-8')
        update = {}
        for f in FIELDS:
            m = re.search(rf'^{f}:\s*(\d+)', content, re.MULTILINE)
            if m:
                update[f] = int(m.group(1))
        result = sb.table('prompts').update(update).eq('slug', slug).execute()
        print(f'{"✅" if result.data else "❌"} {slug}: {update}')
        break
