#!/usr/bin/env python3
"""修复包含 @handle 的 prompt 问题 - 按 slug 查询"""
import os
import re
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

env_file = project_root / '.env.local'
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

from supabase import create_client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 这些是 slug，不是 id
PROBLEM_SLUGS = [
    'prompt-2101521758260285910',
    'prompt-2102682075077980418',
    'prompt-2101194432041382401',
    'prompt-2102677759038496809',
    'prompt-2102738823931118067',
    'prompt-2102970523466797329',
    'prompt-2103359591849615733',
    'prompt-2099451908381692387',
    '2103152232837587256',
    '2103401015257284851',
    '2103082007970668842',
    '2103394092239802494',
    '2103120556346523985',
]

def clean_prompt(text):
    if not text:
        return text
    # 移除 @handle
    text = re.sub(r'@\w+', '', text)
    # 移除日期
    text = re.sub(r'\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b', '', text)
    # 移除互动数据
    text = re.sub(r'\b\d+[KkMm]?\s*(likes?|views?|shares?|comments?|reposts?)\b', '', text, flags=re.IGNORECASE)
    # 清理多余空白
    text = re.sub(r'\s+', ' ', text).strip()
    # 清理开头结尾标点
    text = re.sub(r'^[\s,，.。;；:：\-–—]+', '', text)
    text = re.sub(r'[\s,，.。;；:：\-–—]+$', '', text)
    return text

def main():
    print("=" * 60)
    print("🔧 修复 @handle 问题")
    print("=" * 60)
    
    result = supabase.table('prompts').select('id, slug, prompt, title').in_('slug', PROBLEM_SLUGS).execute()
    
    if not result.data:
        print("❌ 未找到这些 prompt")
        return
    
    print(f"\n找到 {len(result.data)} 条记录\n")
    
    fixed_count = 0
    for item in result.data:
        original = item.get('prompt') or ''
        cleaned = clean_prompt(original)
        
        if original != cleaned:
            print(f"📝 {item['slug']}")
            print(f"   原标题: {item.get('title', 'N/A')}")
            print(f"   原 prompt: {original[:200]}")
            print(f"   清理后: {cleaned[:200]}")
            
            update_result = supabase.table('prompts').update({
                'prompt': cleaned
            }).eq('slug', item['slug']).execute()
            
            if update_result.data is not None:
                print(f"   ✅ 已更新\n")
                fixed_count += 1
            else:
                print(f"   ❌ 更新失败\n")
        else:
            print(f"✓ {item['slug']} - 无需清理（可能是误报）\n")
    
    print("=" * 60)
    print(f"✅ 修复完成: {fixed_count}/{len(result.data)} 条")
    print("=" * 60)

if __name__ == '__main__':
    main()
