#!/usr/bin/env python3
"""
采集校验脚本 v1.0

功能：
1. 检查昨天自动采集是否成功
2. 如果失败，自动重试
3. 生成校验报告

使用场景：
- 每天 7:30 自动运行
- 检查 6:00 的自动采集任务
"""

import json
import sys
import subprocess
from pathlib import Path
from datetime import datetime, timedelta

# 配置
PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_DIR = PROJECT_ROOT / 'scripts' / 'auto-collect' / 'logs'
TWEETS_BATCH = PROJECT_ROOT / 'data' / 'auto-collect' / 'tweets_batch.json'
PREPROCESSED = PROJECT_ROOT / 'data' / 'auto-collect' / 'preprocessed.json'

def check_yesterday_collection():
    """检查昨天的采集情况"""
    yesterday = datetime.now() - timedelta(days=1)
    date_str = yesterday.strftime('%Y-%m-%d')
    
    print(f"🔍 检查 {date_str} 的采集情况\n")
    
    # 检查 tweets_batch.json 是否存在且是昨天的
    if not TWEETS_BATCH.exists():
        print(f"❌ tweets_batch.json 不存在")
        return False
    
    mtime = datetime.fromtimestamp(TWEETS_BATCH.stat().st_mtime)
    if mtime.date() != yesterday.date():
        print(f"❌ tweets_batch.json 不是昨天的（最后修改: {mtime.date()}）")
        return False
    
    # 读取数据
    with open(TWEETS_BATCH, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    
    print(f"✅ tweets_batch.json: {len(tweets)} 条")
    
    # 检查 preprocessed.json
    if not PREPROCESSED.exists():
        print(f"❌ preprocessed.json 不存在")
        return False
    
    with open(PREPROCESSED, 'r', encoding='utf-8') as f:
        preprocessed = json.load(f)
    
    print(f"✅ preprocessed.json: {len(preprocessed)} 条")
    
    # 检查 markdown 文件
    prompts_dir = PROJECT_ROOT / 'content' / 'prompts' / yesterday.strftime('%Y/%m/%d')
    if not prompts_dir.exists():
        print(f"❌ 未找到 {date_str} 的 markdown 文件")
        return False
    
    md_files = list(prompts_dir.glob('*.md'))
    print(f"✅ markdown 文件: {len(md_files)} 条")
    
    # 检查图片
    images_dir = PROJECT_ROOT / 'public' / 'images' / 'prompts'
    image_count = 0
    for md_file in md_files:
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'images:' in content:
            # 简单统计图片数量
            image_count += content.count('/images/prompts/')
    
    print(f"✅ 图片引用: {image_count} 张")
    
    # 检查 git 提交
    result = subprocess.run(
        ['git', 'log', '--oneline', '--since', f'{date_str} 00:00', '--until', f'{date_str} 23:59'],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True
    )
    
    commits = result.stdout.strip().split('\n')
    auto_commits = [c for c in commits if '自动采集' in c or 'auto-collect' in c]
    
    if auto_commits:
        print(f"✅ Git 提交: {len(auto_commits)} 个")
    else:
        print(f"⚠️ 未找到自动采集的 Git 提交")
    
    print(f"\n✅ {date_str} 采集成功")
    return True

def retry_collection():
    """重试采集"""
    print("\n🔄 开始重试采集...\n")
    
    # 运行采集脚本
    scripts = [
        'fetch-tweets.py',
        'preprocess.py',
    ]
    
    for script in scripts:
        script_path = Path(__file__).parent / script
        if not script_path.exists():
            print(f"❌ 脚本不存在: {script}")
            return False
        
        print(f"运行 {script}...")
        result = subprocess.run(
            ['python3', str(script_path)],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ {script} 失败:")
            print(result.stderr)
            return False
        
        print(f"✅ {script} 完成\n")
    
    return True

def main():
    print(f"{'='*60}")
    print(f"📋 采集校验报告")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")
    
    # 检查昨天的采集
    success = check_yesterday_collection()
    
    if not success:
        print("\n⚠️ 昨天的采集可能失败，需要重试")
        
        # 询问是否重试（自动模式下直接重试）
        if '--auto' in sys.argv:
            retry_success = retry_collection()
            if retry_success:
                print("\n✅ 重试成功")
            else:
                print("\n❌ 重试失败")
                sys.exit(1)
        else:
            print("\n💡 运行: python3 verify-collection.py --auto 进行重试")
    
    print(f"\n{'='*60}")
    print(f"✅ 校验完成")

if __name__ == "__main__":
    main()
