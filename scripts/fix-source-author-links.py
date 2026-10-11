#!/usr/bin/env python3
"""
修复 source 和 author_link 字段问题
1. source 和 source_link 不一致 → 用 source_link 覆盖 source
2. 缺少 author_link → 从 source_link 提取用户名构建
3. 批量更新到 Supabase
"""

import requests
import os
import json
import re
from pathlib import Path

# 加载环境变量
env_path = Path('.env.local')
with open(env_path) as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k] = v.strip('"').strip("'")

url = os.environ['NEXT_PUBLIC_SUPABASE_URL']
key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

def extract_username_from_url(url):
    """从 x.com 链接提取用户名"""
    if not url or 'x.com' not in url:
        return None
    
    # 匹配 x.com/username 或 x.com/username/status/xxx
    match = re.search(r'x\.com/([^/]+)', url)
    if match:
        username = match.group(1)
        # 排除一些非用户名的路径
        if username not in ['i', 'intent', 'search', 'hashtag']:
            return username
    return None

def fetch_all_data():
    """分页获取所有数据"""
    all_records = []
    offset = 0
    while True:
        resp = requests.get(
            f'{url}/rest/v1/prompts',
            params={
                'select': 'slug,title,source,source_link,author,author_link',
                'limit': 1000,
                'offset': offset
            },
            headers=headers
        )
        data = resp.json()
        if not data:
            break
        all_records.extend(data)
        if len(data) < 1000:
            break
        offset += 1000
    return all_records

def check_issues(record):
    """检查记录的问题"""
    issues = []
    
    # 检查 source 和 source_link 不一致
    if record.get('source') and record.get('source_link') and record['source'] != record['source_link']:
        issues.append('source_mismatch')
    
    # 检查缺少 author_link
    if not record.get('author_link'):
        issues.append('missing_author_link')
    
    # 检查 source_link 格式异常
    if record.get('source_link') and 'x.com' not in record['source_link'] and 'twitter.com' not in record['source_link']:
        issues.append('source_link_invalid')
    
    # 检查缺少 source_link
    if not record.get('source_link'):
        issues.append('missing_source_link')
    
    # 检查 author_link 格式异常
    if record.get('author_link') and 'x.com' not in record['author_link'] and 'twitter.com' not in record['author_link']:
        issues.append('author_link_invalid')
    
    return issues

def fix_record(record):
    """修复单条记录"""
    updates = {}
    
    # 修复 source 字段
    if record.get('source_link'):
        updates['source'] = record['source_link']
    
    # 修复 author_link 字段
    if not record.get('author_link') and record.get('source_link'):
        username = extract_username_from_url(record['source_link'])
        if username:
            updates['author_link'] = f'https://x.com/{username}'
    
    return updates

def batch_update(updates_list):
    """批量更新到 Supabase - 使用批量 RPC 调用"""
    if not updates_list:
        return 0, 0
    
    success = 0
    fail = 0
    
    # 分批更新，每批 100 条，使用批量 RPC
    batch_size = 100
    for i in range(0, len(updates_list), batch_size):
        batch = updates_list[i:i+batch_size]
        
        # 构建批量更新数据
        batch_data = []
        for item in batch:
            batch_data.append({
                'slug': item['slug'],
                **item['updates']
            })
        
        # 使用批量更新 RPC
        resp = requests.post(
            f'{url}/rest/v1/rpc/batch_update_prompts',
            headers=headers,
            json={'data': batch_data}
        )
        
        if resp.status_code == 200:
            success += len(batch)
            print(f"  ✅ 批次 {i//batch_size + 1}: 更新 {len(batch)} 条")
        else:
            # 如果批量失败，回退到逐条更新
            print(f"  ⚠️  批量更新失败，回退到逐条更新...")
            for item in batch:
                slug = item['slug']
                data = item['updates']
                
                resp = requests.patch(
                    f'{url}/rest/v1/prompts?slug=eq.{slug}',
                    headers=headers,
                    json=data
                )
                
                if resp.status_code == 200:
                    success += 1
                else:
                    fail += 1
                    print(f"    ❌ 更新失败 {slug}: {resp.status_code}")
    
    return success, fail

def main():
    print("🔍 获取所有数据...")
    all_records = fetch_all_data()
    print(f"总数据: {len(all_records)} 条\n")
    
    # 检查问题
    updates_list = []
    problem_count = 0
    
    for record in all_records:
        issues = check_issues(record)
        if issues:
            problem_count += 1
            updates = fix_record(record)
            if updates:
                updates_list.append({
                    'slug': record['slug'],
                    'updates': updates,
                    'issues': issues
                })
    
    print(f"发现 {problem_count} 条有问题的数据")
    print(f"需要更新: {len(updates_list)} 条\n")
    
    if not updates_list:
        print("✅ 无需修复")
        return
    
    # 统计问题类型
    problem_types = {}
    for item in updates_list:
        for issue in item['issues']:
            problem_types[issue] = problem_types.get(issue, 0) + 1
    
    print("问题类型统计:")
    for issue, count in sorted(problem_types.items(), key=lambda x: -x[1]):
        print(f"  {issue}: {count} 条")
    print()
    
    # 批量更新
    print("🔄 开始更新到 Supabase...")
    success, fail = batch_update(updates_list)
    
    print(f"\n✅ 更新完成")
    print(f"  成功: {success} 条")
    print(f"  失败: {fail} 条")

if __name__ == '__main__':
    main()
