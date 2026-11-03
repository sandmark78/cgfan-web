#!/usr/bin/env python3
"""Fix short titles for today's collected items using LLM."""
import json
import sys
import os
from pathlib import Path
from datetime import datetime

sys.path.insert(0, 'scripts')
sys.path.insert(0, 'scripts/auto-collect')

from supabase_utils import get_client
from importlib.machinery import SourceFileLoader

# Load short titles
with open('data/auto-collect/short_titles_today.json', 'r') as f:
    short_titles = json.load(f)

print(f"需要修复的标题: {len(short_titles)} 条")

# Import LLM process module
llm_process = SourceFileLoader('llm_process', 'scripts/auto-collect/llm-process.py').load_module()

client = get_client()
fixed_count = 0

for item in short_titles:
    slug = item['slug']
    old_title = item['title']
    prompt = item.get('prompt', '')[:300]
    
    print(f"\n处理: {slug}")
    print(f"  旧标题: {old_title}")
    
    try:
        # Generate new title via LLM
        new_title = llm_process.generate_title(prompt)
        print(f"  新标题: {new_title}")
        
        # Update Supabase
        client.table('prompts').update({'title': new_title}).eq('slug', slug).execute()
        
        # Find and update markdown file
        date_prefix = item.get('added', '')[:10].replace('-', '/')
        md_path = Path('content/prompts') / date_prefix / f"{slug}.md"
        
        if md_path.exists():
            content = md_path.read_text(encoding='utf-8')
            # Replace title in frontmatter
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith('title:'):
                    new_lines.append(f'title: "{new_title}"')
                else:
                    new_lines.append(line)
            md_path.write_text('\n'.join(new_lines), encoding='utf-8')
            print(f"  ✓ Markdown 已更新: {md_path}")
        
        fixed_count += 1
    except Exception as e:
        print(f"  ✗ 修复失败: {e}")

print(f"\n=== 修复完成: {fixed_count}/{len(short_titles)} 条 ===")
