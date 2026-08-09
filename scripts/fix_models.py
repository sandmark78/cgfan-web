#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.abspath('.'))
from scripts.supabase_utils import get_client

client = get_client()

# 统一模型名称，使其与前端 ALL_MODELS 匹配
updates = [
    ('Common', '通用 Prompt'),
    ('GPT-Image2', 'GPT-image2'),
    ('GPT Image 2', 'GPT-image2'),
    ('GPT-Image', 'GPT-image2'),
    ('ChatGPT', 'GPT-image2'),
    ('AI', '未知'),
    ('unknown', '未知'),
]

for old, new in updates:
    res = client.table('prompts').update({'model': new}).eq('model', old).execute()
    print(f"Updated '{old}' -> '{new}': {len(res.data)} rows")

print("Done.")
