#!/usr/bin/env python3
"""
批量修复数据库中的模型名称
将 "Common" → "通用 Prompt"
将 "GPT Image 2" → "GPT-image2"
将 "ChatGPT" → "GPT-image2"
"""

import os
import sys
import re
from pathlib import Path

# 添加项目根目录到 path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from supabase import create_client

# 手动读取 .env.local
env_file = project_root / '.env.local'
if not env_file.exists():
    print("❌ 找不到 .env.local")
    sys.exit(1)

env_vars = {}
with open(env_file, 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            env_vars[key.strip()] = value.strip()

supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ 缺少环境变量")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

# 需要修复的模型映射
MODEL_FIXES = {
    'Common': '通用 Prompt',
    'GPT Image 2': 'GPT-image2',
    'ChatGPT': 'GPT-image2',
}

def fix_models():
    total_fixed = 0
    
    for old_name, new_name in MODEL_FIXES.items():
        print(f"\n🔄 修复: {old_name} → {new_name}")
        
        # 查询所有需要修复的记录
        response = supabase.table('prompts').select('id').eq('model', old_name).execute()
        records = response.data
        
        if not records:
            print(f"  ✅ 没有需要修复的 {old_name}")
            continue
        
        print(f"  📊 找到 {len(records)} 条记录")
        
        # 批量更新
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            ids = [r['id'] for r in batch]
            
            update_response = supabase.table('prompts').update({
                'model': new_name
            }).in_('id', ids).execute()
            
            if update_response.data:
                print(f"  ✅ 更新 {len(update_response.data)} 条")
                total_fixed += len(update_response.data)
            else:
                print(f"  ❌ 更新失败")
    
    print(f"\n{'='*60}")
    print(f"✅ 完成！共修复 {total_fixed} 条记录")
    print(f"{'='*60}")

if __name__ == '__main__':
    fix_models()
