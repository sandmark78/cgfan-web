#!/usr/bin/env python3
"""Fix short titles in Supabase for today's entries."""
import sys
import os
import re
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
sys.path.insert(0, os.path.join(WORKDIR, 'scripts'))
from supabase_utils import get_client

# Load the keyword extraction from fix-short-titles
sys.path.insert(0, os.path.join(WORKDIR, 'scripts'))
from importlib.machinery import SourceFileLoader
fix_mod = SourceFileLoader('fix_short', os.path.join(WORKDIR, 'scripts/fix-short-titles.py')).load_module()

client = get_client()
result = client.table('prompts').select('slug,title,prompt,category').gte('added', '2026-10-20').execute()

short_titles = []
for item in result.data:
    title = item.get('title', '')
    if len(title) <= 10 or title in ['海报', '肖像', '字体', '陶瓷'] or ('·' in title and len(title) <= 12):
        short_titles.append(item)

print(f"Found {len(short_titles)} short titles to fix")

fixed = 0
for item in short_titles:
    prompt_text = item.get('prompt', '') or ''
    category = item.get('category', '') or ''
    new_title = fix_mod.generate_title_from_prompt(prompt_text, category)
    
    # Update Supabase
    res = client.table('prompts').update({'title': new_title}).eq('slug', item['slug']).execute()
    
    # Also update markdown file
    slug = item['slug']
    # Find the markdown file
    for root, dirs, files in os.walk(os.path.join(WORKDIR, 'content/prompts')):
        for f in files:
            if f == f'{slug}.md':
                fpath = os.path.join(root, f)
                with open(fpath, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                old_title = item['title']
                new_content = content.replace(f'title: "{old_title}"', f'title: "{new_title}"')
                with open(fpath, 'w', encoding='utf-8') as fh:
                    fh.write(new_content)
                break
    
    print(f"  ✅ {slug}: \"{item['title']}\" → \"{new_title}\"")
    fixed += 1

print(f"\n✅ Fixed {fixed} titles in Supabase + markdown")
