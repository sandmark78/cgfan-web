#!/usr/bin/env python3
"""
增量同步：只同步今日修改的 markdown 文件到 Supabase
字段映射复用 supabase_utils.prompt_to_db_row（已验证正确）
用 curl 避免 Python SDK 的 SSL 问题
"""
import json
import re
import subprocess
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from supabase_utils import prompt_to_db_row

# 读取环境
env = {}
for line in (project_root / '.env.local').read_text().split('\n'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        env[key.strip()] = value.strip()

url = env.get('NEXT_PUBLIC_SUPABASE_URL', '')
key = env.get('SUPABASE_SERVICE_ROLE_KEY', '')

headers = [
    '-H', f'apikey: {key}',
    '-H', f'Authorization: Bearer {key}',
    '-H', 'Content-Type: application/json',
    '-H', 'Prefer: resolution=merge-duplicates'
]

def parse_md(file_path):
    """解析 markdown 为 PromptData 格式"""
    content = file_path.read_text(encoding='utf-8')
    
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        return None
    fm = fm_match.group(1)
    
    data = {}
    for line in fm.split('\n'):
        if ':' in line and not line.strip().startswith('-'):
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            if key == 'tags' and value.startswith('['):
                try:
                    data[key] = json.dumps(json.loads(value))
                except:
                    pass
            elif key in ('images',):
                continue
            else:
                data[key] = value
    
    # images 数组
    images = re.findall(r'^\s*-\s*"([^"]+)"', fm, re.MULTILINE)
    if images:
        data['images'] = images
    
    # tags 数组（YAML 列表格式）
    tags_match = re.search(r'^tags:\s*\n((?:\s*-\s*"[^"]+"\n?)+)', fm, re.MULTILINE)
    if tags_match:
        tags = re.findall(r'-\s*"([^"]+)"', tags_match.group(1))
        if tags:
            data['tags'] = json.dumps(tags)
    
    # prompt
    prompt_match = re.search(r'## Prompt\s*\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if prompt_match:
        data['prompt'] = prompt_match.group(1).strip()
    
    # tags 转 list
    if isinstance(data.get('tags'), str) and data['tags'].startswith('['):
        data['tags'] = json.loads(data['tags'])
    else:
        data['tags'] = data.get('tags', [])
    
    # 补默认字段
    data.setdefault('model', '通用 Prompt')
    data.setdefault('category', 'uncategorized')
    data.setdefault('difficulty', 'intermediate')
    data.setdefault('images', [])
    data.setdefault('prompt', '')
    
    return data

def main():
    # 找到今日修改的文件
    today_dir = project_root / 'content' / 'prompts' / '2026' / '08' / '26'
    modified = sorted(today_dir.glob('*.md'))
    
    # 加上 git 修改的文件
    result = subprocess.run(['git', 'status', '--short', '--', 'content/prompts/'],
                           capture_output=True, text=True, cwd=project_root)
    for line in result.stdout.split('\n'):
        line = line.strip()
        if line and line.endswith('.md'):
            path = line.split()[-1]
            modified.append(project_root / path)
    
    # 去重
    seen = set()
    unique = []
    for f in modified:
        if str(f) not in seen and f.exists():
            seen.add(str(f))
            unique.append(f)
    
    print(f"📦 发现 {len(unique)} 个需要同步的文件\n")
    
    if not unique:
        print("✅ 无需要同步的文件")
        return
    
    success = 0
    fail = 0
    
    for md_file in unique:
        data = parse_md(md_file)
        if not data or not data.get('slug'):
            print(f"  ❌ {md_file.name}: 无法解析")
            fail += 1
            continue
        
        # 转 db row（复用正确映射）
        row = prompt_to_db_row(data)
        
        # 过滤 None / 空字符串
        row = {k: v for k, v in row.items() if v is not None and v != ''}
        if 'mtime' in row and row['mtime'] is None:
            row['mtime'] = int(md_file.stat().st_mtime)
        
        # upsert（返回 204 表示成功，无 body）
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST',
             f'{url}/rest/v1/prompts?on_conflict=slug',
             *headers, '-d', json.dumps(row)],
            capture_output=True, text=True
        )
        
        status = result.stdout.strip()
        if status in ('200', '201', '204'):
            print(f"  ✅ {md_file.name}")
            success += 1
        else:
            print(f"  ❌ {md_file.name}: HTTP {status}")
            fail += 1
    
    print(f"\n{'='*60}")
    print(f"✅ 同步完成: {success} 成功, {fail} 失败")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()