#!/usr/bin/env python3
"""Fix score field to match sum of 8 dimensions in frontmatter."""
import re
from pathlib import Path

WORKDIR = "/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web"
prompts_dir = Path(WORKDIR) / "content/prompts"
fixed = 0

dims_list = ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic']
dims8_list = ['curator', 'curation']

for md_file in prompts_dir.rglob("prompt-*.md"):
    content = md_file.read_text()
    fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        continue
    fm_text = fm_match.group(1)

    score_match = re.search(r'score:\s*(\d+)/80', fm_text)
    if not score_match:
        continue
    total = int(score_match.group(1))

    dims = {}
    for dim in dims_list:
        dim_match = re.search(rf'{dim}:\s*(\d+(?:\.\d+)?)/10', fm_text)
        if dim_match:
            dims[dim] = float(dim_match.group(1))
    # 8th dim: could be 'curator' or 'curation'
    for dim8 in dims8_list:
        dim_match = re.search(rf'{dim8}:\s*(\d+(?:\.\d+)?)/10', fm_text)
        if dim_match:
            dims[dim8] = float(dim_match.group(1))
            break

    if len(dims) != 8:
        continue

    calculated = int(sum(dims.values()))
    if calculated != total:
        new_fm = fm_text.replace(f'score: {total}/80', f'score: {calculated}/80')
        new_content = content.replace(fm_text, new_fm)

        # Also fix body score if present
        body_score_match = re.search(r'\*\*评分\*\*:\s*\d+/80', new_content)
        if body_score_match:
            new_content = new_content.replace(body_score_match.group(), f'**评分**: {calculated}/80')

        md_file.write_text(new_content)
        print(f"✅ {md_file.name}: {total} → {calculated}")
        fixed += 1

print(f"\n共修复 {fixed} 个文件的评分不一致问题")
