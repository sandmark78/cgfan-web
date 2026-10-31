#!/usr/bin/env python3
"""
修复历史数据问题：
1. 重新生成过短的标题（≤8字）
2. 修复封面为空的记录
3. 修复缺失的图片文件
"""

import sys
import json
import re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'auto-collect'))
sys.path.insert(0, str(Path(__file__).parent))

from llm_cleaner import call_llm
from supabase_utils import get_client

def regenerate_title(prompt_text: str) -> str:
    """使用LLM重新生成标题"""
    llm_prompt = f"""你是CGfan网站的标题策展专家。为以下AI提示词生成一个**有画面感的中文标题**。

## 提示词

```
{prompt_text[:500]}
```

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

只输出标题，不要序号，不要解释，不要引号。
"""
    
    try:
        response = call_llm(llm_prompt, max_tokens=100)
        title = response.strip().strip('"\'「」『』【】')
        # 清理换行和多余字符
        title = title.split('\n')[0].strip()
        return title
    except Exception as e:
        print(f"  ❌ LLM调用失败: {e}")
        return None

def fix_short_titles():
    """修复过短的标题"""
    print("=== 修复过短标题 ===\n")
    
    prompts_dir = Path('content/prompts')
    fixed_count = 0
    
    # 查找所有标题≤8字的文件
    for md_file in prompts_dir.rglob('*.md'):
        content = md_file.read_text(encoding='utf-8')
        
        # 提取标题
        title_match = re.search(r'^title:\s*"([^"]+)"', content, re.MULTILINE)
        if not title_match:
            continue
        
        title = title_match.group(1)
        if len(title) > 8:
            continue  # 跳过正常标题
        
        # 提取prompt
        prompt_match = re.search(r'^## Prompt\s+(.+?)(?=\n##|\Z)', content, re.MULTILINE | re.DOTALL)
        if not prompt_match:
            print(f"⚠️  {md_file.name}: 无法提取prompt")
            continue
        
        prompt_text = prompt_match.group(1).strip()
        
        print(f"📝 原标题 [{len(title)}字]: {title}")
        print(f"   文件: {md_file.name}")
        
        # 重新生成标题
        new_title = regenerate_title(prompt_text)
        if not new_title or len(new_title) <= 8:
            print(f"   ❌ 新标题不合格: {new_title}")
            continue
        
        print(f"   ✅ 新标题 [{len(new_title)}字]: {new_title}")
        
        # 更新markdown文件
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
            print(f"   ✅ 已更新数据库\n")
        except Exception as e:
            print(f"   ⚠️  数据库更新失败: {e}\n")
        
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
        
        # 检查是否有images字段
        images_match = re.search(r'^images:\s*\[(.*?)\]', content, re.MULTILINE)
        if not images_match:
            print(f"⚠️  {md_file.name}: 无images字段")
            continue
        
        images_str = images_match.group(1)
        if not images_str.strip():
            print(f"⚠️  {md_file.name}: images为空")
            continue
        
        # 提取第一张图片作为封面
        first_image = images_str.split(',')[0].strip().strip('"\'')
        if not first_image:
            continue
        
        print(f"🖼️  {md_file.name}")
        print(f"   设置封面: {first_image}")
        
        # 更新markdown文件
        new_content = content.replace('cover: ""', f'cover: "{first_image}"')
        md_file.write_text(new_content, encoding='utf-8')
        
        # 更新Supabase
        try:
            supabase = get_supabase()
            slug = md_file.stem
            supabase.table('prompts').update({'cover': first_image}).eq('slug', slug).execute()
            print(f"   ✅ 已更新数据库\n")
        except Exception as e:
            print(f"   ⚠️  数据库更新失败: {e}\n")
        
        fixed_count += 1
    
    print(f"\n✅ 共修复 {fixed_count} 个封面")

if __name__ == '__main__':
    fix_short_titles()
    fix_empty_covers()
    print("\n🎉 修复完成！")
