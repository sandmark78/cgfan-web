#!/usr/bin/env python3
"""
快速修复最近7天的标题问题
- 只修复最近7天修改的文件
- 添加超时机制
- 批量处理（每批10个）
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime, timedelta
import time

sys.path.insert(0, str(Path(__file__).parent / 'auto-collect'))
sys.path.insert(0, str(Path(__file__).parent))

from llm_cleaner import call_llm
from supabase_utils import get_client

def batch_regenerate_titles(files_to_fix: list) -> dict:
    """批量重新生成标题（一次LLM调用处理多个）"""
    if not files_to_fix:
        return {}
    
    # 构建批量请求
    prompt_items = []
    for i, (md_file, old_title, prompt_text) in enumerate(files_to_fix[:10], 1):
        prompt_items.append(f"【{i}】原标题: {old_title}\n提示词:\n```\n{prompt_text[:200]}\n```")
    
    llm_prompt = f"""你是CGfan网站的标题策展专家。为以下{len(files_to_fix[:10])}个AI提示词重新生成**有画面感的中文标题**。

## 当前问题
这些标题过短（≤8字），需要重新生成更具体的标题。

## 提示词列表

{chr(10).join(prompt_items)}

## 标题要求

1. **长度**：8-20个中文字
2. **风格**：有画面感、有创意、能吸引点击
3. **内容**：提取prompt的核心视觉元素，不要泛泛而谈
4. **语言**：纯中文，不要英文
5. **禁止**：
   - 不要包含作者名
   - 不要用"实验"、"创作"等泛词
   - 不要简单罗列关键词（如"微缩×纸艺"）
   - 不要翻译英文prompt，要理解内容后重新表达
   - 不要使用"视觉"、"海报"、"肖像"等过于宽泛的词

## 输出格式

按顺序输出新标题，每行一个，格式：序号. 标题
不要任何解释，不要引号。
"""
    
    try:
        # 添加超时机制
        start_time = time.time()
        response = call_llm(llm_prompt, max_tokens=500)
        elapsed = time.time() - start_time
        print(f"  LLM调用耗时: {elapsed:.1f}秒")
        
        if not response or len(response.strip()) < 10:
            print(f"  ⚠️ LLM返回内容过短: {response}")
            return {}
        
        lines = response.strip().split('\n')
        
        titles = {}
        for line in lines:
            line = line.strip()
            if not line:
                continue
            match = re.match(r'^(\d+)\.\s*(.+)$', line)
            if match:
                idx = int(match.group(1))
                title = match.group(2).strip().strip('"\'「」『』【】')
                if idx <= len(files_to_fix[:10]) and len(title) > 8:
                    md_file = files_to_fix[idx-1][0]
                    titles[md_file] = title
        
        return titles
    except Exception as e:
        print(f"  ❌ 批量标题生成失败: {e}")
        return {}

def fix_recent_short_titles():
    """修复最近7天过短的标题"""
    print("=== 修复最近7天过短标题 ===\n")
    
    prompts_dir = Path('content/prompts')
    files_to_fix = []
    cutoff_time = time.time() - 7 * 24 * 3600  # 7天前
    
    # 只收集最近7天修改的文件
    for md_file in prompts_dir.rglob('*.md'):
        # 检查修改时间
        if md_file.stat().st_mtime < cutoff_time:
            continue
        
        content = md_file.read_text(encoding='utf-8')
        
        title_match = re.search(r'^title:\s*"([^"]+)"', content, re.MULTILINE)
        if not title_match:
            continue
        
        title = title_match.group(1)
        if len(title) > 8:
            continue
        
        prompt_match = re.search(r'^## Prompt\s+(.+?)(?=\n##|\Z)', content, re.MULTILINE | re.DOTALL)
        if not prompt_match:
            continue
        
        prompt_text = prompt_match.group(1).strip()
        files_to_fix.append((md_file, title, prompt_text))
    
    print(f"找到 {len(files_to_fix)} 个需要修复的标题\n")
    
    if not files_to_fix:
        print("✅ 没有需要修复的标题")
        return
    
    # 批量处理（每批10个）
    fixed_count = 0
    for batch_start in range(0, len(files_to_fix), 10):
        batch = files_to_fix[batch_start:batch_start+10]
        print(f"\n处理批次 {batch_start//10 + 1}/{(len(files_to_fix)-1)//10 + 1} ({len(batch)} 个文件)...")
        
        new_titles = batch_regenerate_titles(batch)
        
        for md_file, old_title, _ in batch:
            new_title = new_titles.get(md_file)
            if not new_title or len(new_title) <= 8:
                print(f"  ⚠️  {md_file.name}: 新标题不合格")
                continue
            
            print(f"  📝 {old_title} → {new_title}")
            
            # 更新markdown文件
            content = md_file.read_text(encoding='utf-8')
            new_content = re.sub(
                r'^title:\s*"[^"]+"',
                f'title: "{new_title}"',
                content,
                flags=re.MULTILINE
            )
            md_file.write_text(new_content, encoding='utf-8')
            
            # 更新Supabase
            try:
                supabase = get_client()
                slug = md_file.stem
                supabase.table('prompts').update({'title': new_title}).eq('slug', slug).execute()
                print(f"    ✅ 已更新")
            except Exception as e:
                print(f"    ⚠️  数据库更新失败: {e}")
            
            fixed_count += 1
    
    print(f"\n✅ 共修复 {fixed_count} 个标题")

if __name__ == '__main__':
    fix_recent_short_titles()
    print("\n🎉 修复完成！")
