#!/usr/bin/env python3
"""
检查内容是否真正包含生图提示词
"""
import re
from pathlib import Path

prompts_dir = Path('/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts')

to_delete = []

for md_file in sorted(prompts_dir.rglob('*.md')):
    if 'manual' in str(md_file):
        continue
    
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fm_match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        continue
    
    frontmatter = fm_match.group(1)
    title_match = re.search(r'title:\s*["\']?(.+?)["\']?\s*$', frontmatter, re.MULTILINE)
    title = title_match.group(1) if title_match else ''
    
    # 提取提示词正文
    body = content.split('---')[-1].strip() if content.count('---') > 1 else ''
    
    # 判断是否为生图提示词
    is_prompt = False
    reasons = []
    
    # 生图提示词关键词
    prompt_keywords = [
        'prompt', 'create', 'generate', 'image', 'render', 'photograph',
        'portrait', 'landscape', '3d', 'cinematic', 'illustration',
        'digital art', 'concept art', 'style', 'aesthetic', 'design',
        'composition', 'lighting', 'color', 'texture', 'detail',
        'ultra-realistic', 'hyper-realistic', '8k', '4k',
        'Aspect Ratio', 'ar ', '--ar', '--v ', '--s ', '--style',
        'midjourney', 'gpt image', 'gemini', 'dalle', 'stable diffusion',
        'niji', 'seedream', 'firefly',
        '镜头', '焦距', '光圈', '快门', 'ISO',
        '色彩', '光影', '构图', '风格',
        '生成', '创建', '绘制', '渲染',
        '提示词', 'prompt👇', 'Prompt:',
    ]
    
    # 非生图关键词（教程/讨论/工具类）
    non_prompt_keywords = [
        '教程', '技巧', '分享', '方法', '工具', '工作流',
        '如何', '怎么', '为什么', 'tutorial', 'guide', 'how to',
        'tips', 'tricks', 'workflow', '工具推荐',
    ]
    
    # 检查标题
    title_lower = title.lower()
    has_non_prompt = any(kw in title_lower for kw in non_prompt_keywords)
    
    # 检查正文
    body_lower = body.lower()
    has_prompt_keyword = any(kw in body_lower for kw in prompt_keywords)
    has_non_prompt_body = any(kw in body_lower for kw in non_prompt_keywords)
    
    # 判断逻辑
    if has_non_prompt and not has_prompt_keyword:
        reasons.append('标题含教程/讨论词，正文无提示词特征')
        is_prompt = False
    elif len(body) < 80:
        reasons.append('正文太短')
        is_prompt = False
    elif not has_prompt_keyword and len(body) > 500:
        # 长文本但没有提示词特征，可能是讨论
        reasons.append('正文较长但无提示词特征')
        is_prompt = False
    else:
        is_prompt = True
    
    if not is_prompt and reasons:
        to_delete.append({
            'file': md_file.relative_to(prompts_dir),
            'title': title[:60],
            'reasons': reasons,
            'body_len': len(body)
        })

print(f'建议删除 {len(to_delete)} 个非提示词文件：\n')
for item in to_delete:
    print(f"  {item['file']}")
    print(f"    标题: {item['title']}")
    print(f"    原因: {', '.join(item['reasons'])}")
    print(f"    正文长度: {item['body_len']}字")
    # 显示正文前100字
    print()