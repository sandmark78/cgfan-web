#!/usr/bin/env python3
"""
批量修复历史数据问题（优化版）
- 批量重新生成标题（一次LLM调用处理多个）
- 修复封面为空的记录
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent / 'auto-collect'))
sys.path.insert(0, str(Path(__file__).parent))

from llm_cleaner import call_llm
from supabase_utils import get_client

def batch_regenerate_titles(files_to_fix: list) -> dict:
    """批量重新生成标题（一次LLM调用处理10个）"""
    if not files_to_fix:
        return {}
    
    # 构建批量请求
    prompt_items = []
    for i, (md_file, old_title, prompt_text) in enumerate(files_to_fix[:10], 1):
        prompt_items.append(f"【{i}】原标题: {old_title}\n提示词:\n```\n{prompt_text[:300]}\n```")
    
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
        response = call_llm(llm_prompt, max_tokens=500)
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
                if idx <= len(files_to_fix[:10]):
                    md_file = files_to_fix[idx-1][0]
                    titles[md_file] = title
        
        return titles
    except Exception as e:
        print(f"❌ 批量标题生成失败: {e}")
        return {}

def fix_short_titles():
    """修复过短的标题"""
    print("=== 修复过短标题 ===\n")
    
    prompts_dir = Path('content/prompts')
    files_to_fix = []
    
    # 收集所有需要修复的文件
    for md_file in prompts_dir.rglob('*.md'):
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
    
    # 批量处理（每批10个）
    fixed_count = 0
    for batch_start in range(0, len(files_to_fix), 10):
        batch = files_to_fix[batch_start:batch_start+10]
        print(f"\n处理批次 {batch_start//10 + 1} ({len(batch)} 个文件)...")
        
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
            except Exception as e:
                print(f"    ⚠️  数据库更新失败: {e}")
            
            fixed_count += 1
    
    print(f"\n✅ 共修复 {fixed_count} 个标题")

def fix_empty_covers():
    """修复封面为空的记录"""
    print("\n=== 修复空封面 ===\n")
    
    prompts_dir = Path('content/prompts')
    fixed_count = 0
    
    for md_file in prompts_dir.rglob('*.md'):
        content = md_file.read_text(encoding='utf-8')
        
        if 'cover: ""' not in content:
            continue
        
        images_match = re.search(r'^images:\s*\[(.*?)\]', content, re.MULTILINE)
        if not images_match:
            print(f"⚠️  {md_file.name}: 无images字段")
            continue
        
        images_str = images_match.group(1)
        if not images_str.strip():
            print(f"⚠️  {md_file.name}: images为空")
            continue
        
        first_image = images_str.split(',')[0].strip().strip('"\'')
        if not first_image:
            continue
        
        print(f"🖼️  {md_file.name}: 设置封面 {first_image}")
        
        new_content = content.replace('cover: ""', f'cover: "{first_image}"')
        md_file.write_text(new_content, encoding='utf-8')
        
        try:
            supabase = get_client()
            slug = md_file.stem
            supabase.table('prompts').update({'cover': first_image}).eq('slug', slug).execute()
        except Exception as e:
            print(f"   ⚠️  数据库更新失败: {e}")
        
        fixed_count += 1
    
    print(f"\n✅ 共修复 {fixed_count} 个封面")

if __name__ == '__main__':
    fix_short_titles()
    fix_empty_covers()
    print("\n🎉 修复完成！")
