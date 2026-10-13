#!/usr/bin/env python3
"""清理重复的旧 slug 记录"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.supabase_utils import get_client

client = get_client()

# 查找所有相关记录
old_slug = '2109803089679331403'
new_slug = 'prompt-2109803089679331403'

# 检查旧记录
old = client.table('prompts').select('slug,cover,source,added').eq('slug', old_slug).execute()
print(f"Old slug record: {old.data}")

# 检查新记录
new = client.table('prompts').select('slug,cover,source,added').eq('slug', new_slug).execute()
print(f"New slug record: {new.data}")

# 删除旧记录
if old.data:
    result = client.table('prompts').delete().eq('slug', old_slug).execute()
    print(f"\n✅ Deleted old record: {result.data}")

# 最终验证
final_old = client.table('prompts').select('slug').eq('slug', old_slug).execute()
final_new = client.table('prompts').select('slug,cover,source').eq('slug', new_slug).execute()
print(f"\nFinal check - old: {len(final_old.data)} records, new: {len(final_new.data)} records")
if final_new.data:
    print(f"  cover: {final_new.data[0].get('cover')}")
    print(f"  source: {final_new.data[0].get('source')}")
