#!/usr/bin/env python3
"""
处理新采集的提示词
- 生成中文标题
- 创建markdown文件
- 下载图片
- 运行prebuild
- 提交部署
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime

def load_new_prompts():
    """加载新采集的提示词"""
    input_path = Path(__file__).parent / 'new_prompts.json'
    with open(input_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_chinese_title(prompt_text):
    """生成中文标题"""
    # TODO: 使用AI生成中文标题
    # 暂时返回临时标题
    return f"自动采集-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

def create_markdown_file(prompt_data, title):
    """创建markdown文件"""
    # TODO: 实现markdown文件创建逻辑
    # 参考现有的采集流程
    pass

def download_images(images, output_dir):
    """下载图片"""
    # TODO: 实现图片下载逻辑
    pass

def run_prebuild():
    """运行prebuild"""
    print("🔨 运行 prebuild...")
    result = subprocess.run(
        ['npm', 'run', 'prebuild'],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent.parent
    )
    
    if result.returncode != 0:
        print(f"❌ prebuild 失败: {result.stderr}")
        return False
    
    print("✅ prebuild 完成")
    return True

def commit_and_push(message):
    """提交并推送"""
    print("📤 提交并推送...")
    
    # git add
    subprocess.run(['git', 'add', '-A'], cwd=Path(__file__).parent.parent.parent)
    
    # git commit
    subprocess.run(
        ['git', 'commit', '-m', message],
        cwd=Path(__file__).parent.parent.parent
    )
    
    # git push
    result = subprocess.run(
        ['git', 'push'],
        cwd=Path(__file__).parent.parent.parent,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"❌ 推送失败: {result.stderr}")
        return False
    
    print("✅ 推送完成")
    return True

def main():
    prompts = load_new_prompts()
    
    if not prompts:
        print("没有新的提示词需要处理")
        return
    
    print(f"🚀 开始处理 {len(prompts)} 条新提示词\n")
    
    for i, prompt_data in enumerate(prompts, 1):
        print(f"\n{'='*60}")
        print(f"处理第 {i}/{len(prompts)} 条")
        print(f"作者: {prompt_data['author']}")
        print(f"分数: {prompt_data['score']}")
        print(f"{'='*60}\n")
        
        # 生成标题
        title = generate_chinese_title(prompt_data['prompt'])
        print(f"标题: {title}")
        
        # 创建markdown文件
        create_markdown_file(prompt_data, title)
        
        # 下载图片
        download_images(prompt_data['images'], 'public/images/prompts')
    
    # 运行prebuild
    if not run_prebuild():
        return
    
    # 提交推送
    message = f"feat: 自动采集 {len(prompts)} 条提示词 ({datetime.now().strftime('%Y-%m-%d')})"
    if commit_and_push(message):
        print(f"\n✅ 自动采集完成，共部署 {len(prompts)} 条提示词")
    else:
        print("\n❌ 部署失败，请检查")

if __name__ == '__main__':
    main()
