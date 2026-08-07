#!/usr/bin/env python3
"""
Supabase 工具模块 - 供所有采集/维护脚本使用
封装 prompts 表的读取、写入、去重、查询操作
"""
import os
import base64
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

# 项目根目录
PROJECT_ROOT = Path(__file__).resolve().parent.parent

def load_env():
    """加载 .env.local 环境变量"""
    env_file = PROJECT_ROOT / '.env.local'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)

def get_client() -> Client:
    """获取 Supabase 客户端"""
    if create_client is None:
        raise ImportError("需要安装 supabase 包: pip install supabase")
    load_env()
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://kxgmtmcspzetyxkhemsw.supabase.co')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if not key:
        raise ValueError("缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量")
    return create_client(url, key)

def db_row_to_prompt(row: Dict) -> Dict:
    """数据库行转 PromptData 格式"""
    return {
        'title': row.get('title', ''),
        'slug': row.get('slug', ''),
        'model': row.get('model', ''),
        'category': row.get('category', ''),
        'tags': row.get('tags') or [],
        'difficulty': row.get('difficulty', 'intermediate'),
        'cover': row.get('cover', ''),
        'images': row.get('images') or [row.get('cover', '')],
        'date': row.get('date', ''),
        'added': row.get('added', ''),
        'source': row.get('source', ''),
        'sourceLink': row.get('source_link', ''),
        'author': row.get('author', ''),
        'authorLink': row.get('author_link'),
        'prompt': row.get('prompt', ''),
        'negativePrompt': row.get('negative_prompt', ''),
        'parameters': row.get('parameters') or {},
        'mtime': row.get('mtime'),
        'promptDNA': row.get('prompt_dna'),
    }

def prompt_to_db_row(prompt: Dict) -> Dict:
    """PromptData 格式转数据库行"""
    return {
        'title': prompt.get('title', ''),
        'slug': prompt.get('slug', ''),
        'model': prompt.get('model', ''),
        'category': prompt.get('category', ''),
        'tags': prompt.get('tags') or [],
        'difficulty': prompt.get('difficulty', 'intermediate'),
        'cover': prompt.get('cover', ''),
        'images': prompt.get('images') or [],
        'date': prompt.get('date', ''),
        'added': prompt.get('added', ''),
        'source': prompt.get('source', ''),
        'source_link': prompt.get('sourceLink', ''),
        'author': prompt.get('author', ''),
        'author_link': prompt.get('authorLink'),
        'prompt': prompt.get('prompt', ''),
        'negative_prompt': prompt.get('negativePrompt', ''),
        'parameters': prompt.get('parameters') or {},
        'mtime': int(prompt['mtime']) if prompt.get('mtime') else None,
        'prompt_dna': prompt.get('promptDNA'),
    }

# ====== 查询操作 ======

def get_all_prompts() -> List[Dict]:
    """获取所有提示词（按 added 倒序）"""
    client = get_client()
    data = client.table('prompts').select('*').order('added', desc=True).execute()
    return [db_row_to_prompt(row) for row in data.data]

def get_prompt_by_slug(slug: str) -> Optional[Dict]:
    """根据 slug 获取提示词"""
    client = get_client()
    data = client.table('prompts').select('*').eq('slug', slug).execute()
    if data.data:
        return db_row_to_prompt(data.data[0])
    return None

def get_prompt_by_tweet_id(tweet_id: str) -> Optional[Dict]:
    """根据推文 ID 获取提示词（用于去重）"""
    slug = f"prompt-{tweet_id}"
    return get_prompt_by_slug(slug)

def is_duplicate(tweet_id: str) -> bool:
    """检查推文是否已收录（基于 slug）"""
    return get_prompt_by_tweet_id(tweet_id) is not None

def check_slug_exists(slug: str) -> bool:
    """检查 slug 是否已存在"""
    return get_prompt_by_slug(slug) is not None

# ====== 写入操作 ======

def upsert_prompt(prompt: Dict) -> bool:
    """插入或更新提示词（基于 slug）"""
    client = get_client()
    row = prompt_to_db_row(prompt)
    result = client.table('prompts').upsert(row, on_conflict='slug').execute()
    return not result.error

def upsert_many(prompts: List[Dict]) -> int:
    """批量插入或更新，返回成功数量"""
    rows = [prompt_to_db_row(p) for p in prompts]
    count = 0
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        result = get_client().table('prompts').upsert(batch, on_conflict='slug').execute()
        if not result.error:
            count += len(batch)
    return count

def delete_prompt_by_slug(slug: str) -> bool:
    """删除提示词"""
    client = get_client()
    result = client.table('prompts').delete().eq('slug', slug).execute()
    return not result.error

# ====== 聚合查询 ======

def get_all_categories() -> List[Dict]:
    """获取所有分类及数量"""
    client = get_client()
    data = client.table('prompts').select('category').execute()
    counts = {}
    for row in data.data:
        cat = row.get('category')
        if cat:
            counts[cat] = counts.get(cat, 0) + 1
    return [{'name': k, 'count': v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]

def get_all_tags() -> List[Dict]:
    """获取所有标签及数量"""
    client = get_client()
    data = client.table('prompts').select('tags').execute()
    counts = {}
    for row in data.data:
        for tag in (row.get('tags') or []):
            counts[tag] = counts.get(tag, 0) + 1
    return [{'name': k, 'count': v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]

# ====== Base64 兼容层（旧脚本过渡用，建议逐步替换） ======

def read_prompts_data_ts() -> List[Dict]:
    """从旧 lib/prompts-data.ts 读取（兼容层，新代码应改用 get_all_prompts）"""
    ts_file = PROJECT_ROOT / 'lib/prompts-data.ts'
    if not ts_file.exists():
        return []
    content = ts_file.read_text(encoding='utf-8')
    match = content.split('`')
    if len(match) < 2:
        return []
    try:
        decoded = base64.b64decode(match[1]).decode('utf-8')
        return json.loads(decoded)
    except Exception:
        return []

def write_prompts_data_ts(prompts: List[Dict]) -> None:
    """写入 lib/prompts-data.ts（兼容层，新代码应改用 upsert_many）"""
    ts_file = PROJECT_ROOT / 'lib/prompts-data.ts'
    encoded = base64.b64encode(json.dumps(prompts, ensure_ascii=False).encode('utf-8')).decode('utf-8')
    ts_file.write_text(f"export default `{encoded}`", encoding='utf-8')