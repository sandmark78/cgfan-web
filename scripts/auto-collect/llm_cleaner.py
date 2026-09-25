#!/usr/bin/env python3
"""
通用LLM prompt清理模块
用于从推文内容中提取干净的AI提示词
"""

import json
import re
import requests
from pathlib import Path

def load_env():
    """加载环境变量"""
    env = {}
    env_path = Path.home() / '.hermes' / 'profiles' / 'cgfan' / '.env'
    if env_path.exists():
        for line in env_path.read_text().split('\n'):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                env[key.strip()] = value.strip()
    return env

def call_llm(prompt_text, max_tokens=3000):
    """调用LLM API"""
    env = load_env()
    api_key = env.get('ALIBABA_CODING_PLAN_API_KEY', '')
    base_url = env.get('ALIBABA_CODING_PLAN_BASE_URL', 'https://coding.dashscope.aliyuncs.com/v1')
    
    if not api_key:
        raise ValueError("未配置 ALIBABA_CODING_PLAN_API_KEY")
    
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
            "max_tokens": max_tokens
        },
        timeout=180
    )
    resp.raise_for_status()
    result = resp.json()
    return result["choices"][0]["message"]["content"]

def extract_prompt_with_llm(alltext):
    """
    用LLM从allText提取干净的正面prompt
    
    Returns:
        tuple: (clean_prompt, status)
            - clean_prompt: 清理后的prompt，如果无prompt则为None
            - status: 'OK', 'NO_PROMPT', 'INCOMPLETE', 'ERROR'
    """
    
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

def clean_prompt_for_display(prompt):
    """
    清理prompt用于显示（去除多余空白、特殊字符等）
    """
    if not prompt:
        return ""
    
    # 去除多余的空白行
    lines = [line.strip() for line in prompt.split('\n')]
    lines = [line for line in lines if line]
    prompt = '\n'.join(lines)
    
    # 去除多余的空格
    prompt = re.sub(r' {2,}', ' ', prompt)
    
    return prompt

if __name__ == "__main__":
    # 测试代码
    test_text = """
===ARTICLE 0===
小小东
@xiaoxiaodong01
Sep 17
【中秋字体海报·奢侈品配色】

提示词Prompt：
由任意未来主题提供核心概念、短句信息和少量辅助说明...

Made with AI
·
1.2K
Views
15
3
"""
    
    prompt, status = extract_prompt_with_llm(test_text)
    print(f"Status: {status}")
    print(f"Prompt: {prompt}")
