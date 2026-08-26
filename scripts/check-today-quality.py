#!/usr/bin/env python3
"""全面验证今日所有markdown文件的prompt质量"""
import re
from pathlib import Path

CONTENT_DIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web/content/prompts/2026/08/26")

def check_file(md_path):
    content = md_path.read_text(encoding='utf-8')
    name = md_path.name
    
    issues = []
    
    # 1. 检查 frontmatter 完整性
    fm_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        return name, ["无 frontmatter"]
    fm = fm_match.group(1)
    
    required_fields = ['title', 'slug', 'author', 'authorLink', 'date', 'added', 'source']
    for field in required_fields:
        m = re.search(rf'^{field}:\s*["\']?([^"\'\n]*)["\']?', fm, re.MULTILINE)
        if not m or not m.group(1).strip():
            issues.append(f"缺失/空 {field}")
    
    # 2. 检查重复 tags
    tag_count = len(re.findall(r'^tags:', fm, re.MULTILINE))
    if tag_count > 1:
        issues.append("重复tags")
    
    # 3. 检查 prompt 部分
    prompt_match = re.search(r'## Prompt\s*\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if not prompt_match:
        issues.append("无 ## Prompt")
    else:
        prompt = prompt_match.group(1).strip()
        # 长度检查
        if len(prompt) < 100:
            issues.append(f"prompt太短({len(prompt)}字符)")
        
        # 杂文检查
        noise_patterns = [
            (r'Made with', 'Made with'),
            (r'Prompt below', 'Prompt below'),
            (r'===ARTICLE', '===ARTICLE'),
            (r'^\d+:\d+\s*(AM|PM)\s*·', '时间戳'),
            (r'^\d+[\d,.]*\s*Views\s*$', 'Views'),
            (r'^@[\w]+\s*$', '@handle'),
        ]
        for pattern, desc in noise_patterns:
            if re.search(pattern, prompt, re.MULTILINE):
                issues.append(f"包含{desc}")
    
    # 4. 检查评分部分
    score_match = re.search(r'## 评分\s*\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    if score_match:
        score_text = score_match.group(1)
        # 检查算术
        m = re.search(r'(\d+)\+(\d+)\+(\d+)\+(\d+)\+(\d+)\+(\d+)\+(\d+)\+(\d+)\s*=\s*(\d+)', score_text)
        if m:
            nums = [int(m.group(i)) for i in range(1, 9)]
            claimed = int(m.group(9))
            actual = sum(nums)
            if actual != claimed:
                issues.append(f"算术错误: {nums}={actual}≠{claimed}")
    
    return name, issues

# 检查所有文件
print("=" * 70)
print("📊 全面质量检查报告")
print("=" * 70)
print()

all_ok = True
for md_path in sorted(CONTENT_DIR.glob('*.md')):
    name, issues = check_file(md_path)
    if issues:
        all_ok = False
        print(f"❌ {name}")
        for issue in issues:
            print(f"   - {issue}")
        print()

if all_ok:
    print("✅ 所有文件检查通过！")
else:
    print("⚠️ 存在上述问题")