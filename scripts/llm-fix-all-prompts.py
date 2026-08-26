#!/usr/bin/env python3
"""
用LLM重新提取所有今日采集的prompt
解决Python脚本无法处理的语义问题：
- 区分正面prompt vs 负面prompt
- 识别被截断的prompt
- 清理作者感想和评论区内容
"""
import json
import re
import sys
import os
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def load_env():
    env = {}
    # 从 Hermes profile 的 .env 读取
    env_path = Path.home() / '.hermes' / 'profiles' / 'cgfan' / '.env'
    if env_path.exists():
        for line in env_path.read_text().split('\n'):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                env[key.strip()] = value.strip()
    return env

def extract_from_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None, content
    frontmatter = match.group(1)
    data = {}
    for line in frontmatter.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            data[key] = value
    return data, content

def call_llm(prompt_text):
    """调用LLM API"""
    import requests
    
    env = load_env()
    api_key = env.get('ALIBABA_CODING_PLAN_API_KEY', '')
    base_url = env.get('ALIBABA_CODING_PLAN_BASE_URL', 'https://coding.dashscope.aliyuncs.com/v1')
    
    resp = requests.post(
        f"{base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "qwen3.7-plus",
            "messages": [{"role": "user", "content": prompt_text}],
            "temperature": 0.3,
            "max_tokens": 3000
        },
        timeout=180
    )
    resp.raise_for_status()
    result = resp.json()
    return result["choices"][0]["message"]["content"]

def extract_prompt_with_llm(alltext):
    """用LLM从allText提取干净的正面prompt"""
    
    llm_prompt = f"""你是CGfan网站的提示词策展专家。分析以下推文内容，提取**干净的正面AI提示词**。

## 推文原始内容（allText）
```
{alltext}
```

## 关键要求

1. **只提取正面prompt**，不要提取：
   - negative prompt / 负面提示词（包含"avoid"、"don't"、"不要"、"禁止"等）
   - 作者感想、创作心得
   - 评论区内容
   - 互动数据、时间戳

2. **prompt可能的位置**：
   - "提示词Prompt：" / "prompt：" 标记后面
   - 图片ALT文本中
   - 评论区（ARTICLE 1+）中
   - 包含Midjourney参数（--ar, --v）的段落
   - 包含"Create"、"Generate"等英文指令的段落

3. **如果推文没有实际提示词**（只是工具介绍/视频演示/状态更新），返回 "NO_PROMPT"

4. **如果提取的prompt被截断或不完整**，返回 "INCOMPLETE"

5. **清理要求**：
   - 删除作者名、@handle、时间戳、互动数据
   - 删除"Made with AI"、"Prompt below"等
   - 删除表情符号
   - 保留完整的prompt内容，不要截断

## 输出格式

直接输出清理后的**完整正面prompt**，不要任何解释、不要markdown代码块标记。

如果无prompt输出：NO_PROMPT
如果不完整输出：INCOMPLETE
"""
    
    try:
        clean_prompt = call_llm(llm_prompt)
        clean_prompt = clean_prompt.strip()
        
        if clean_prompt in ['NO_PROMPT', 'INCOMPLETE']:
            return None, clean_prompt
        
        # 清理可能的markdown代码块标记
        clean_prompt = re.sub(r'^```\w*\n?', '', clean_prompt)
        clean_prompt = re.sub(r'\n?```$', '', clean_prompt)
        
        return clean_prompt, "OK"
    except Exception as e:
        return None, f"ERROR: {e}"

def main():
    # 读取tweets_batch.json
    tweets_path = project_root / 'data' / 'auto-collect' / 'tweets_batch.json'
    with open(tweets_path, 'r', encoding='utf-8') as f:
        tweets = json.load(f)
    tweet_map = {item['id']: item for item in tweets}
    
    # 读取今日所有markdown
    content_dir = project_root / 'content' / 'prompts' / '2026' / '08' / '26'
    md_files = sorted(content_dir.glob('*.md'))
    
    print(f"📦 今日共 {len(md_files)} 个文件\n")
    
    # 用LLM重新提取所有prompt
    print("🤖 调用LLM提取干净的正面prompt...\n")
    
    fixed_count = 0
    no_prompt = 0
    incomplete = 0
    errors = 0
    
    for md_file in md_files:
        data, _ = extract_from_markdown(md_file)
        if not data:
            continue
        
        slug = data.get('slug', '')
        tweet_id = slug.replace('prompt-', '')
        
        if tweet_id not in tweet_map:
            print(f"  ❌ {md_file.name}: 找不到原始推文数据")
            continue
        
        tweet_data = tweet_map[tweet_id]
        alltext = tweet_data.get('allText', '')
        
        print(f"  🔧 {md_file.name} ({tweet_data.get('author', '?')})...")
        
        clean_prompt, status = extract_prompt_with_llm(alltext)
        
        if status == "NO_PROMPT":
            print(f"     → 无有效prompt")
            no_prompt += 1
            continue
        elif status == "INCOMPLETE":
            print(f"     → prompt不完整")
            incomplete += 1
            continue
        elif status != "OK":
            print(f"     → {status}")
            errors += 1
            continue
        
        # 更新markdown文件
        content = md_file.read_text(encoding='utf-8')
        new_content = re.sub(
            r'## Prompt\s*\n.*?(?=\n## |\Z)',
            f'## Prompt\n\n{clean_prompt}\n',
            content,
            flags=re.DOTALL
        )
        md_file.write_text(new_content, encoding='utf-8')
        fixed_count += 1
        print(f"     ✅ 修复完成（{len(clean_prompt)}字符）")
    
    print(f"\n{'='*60}")
    print(f"✅ 修复完成: {fixed_count} 个文件")
    print(f"⚠️  无prompt: {no_prompt} 个")
    print(f"⚠️  不完整: {incomplete} 个")
    print(f"❌ 错误: {errors} 个")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
