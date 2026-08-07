import re
from pathlib import Path

# 从 markdown 读取所有 slug
md_slugs = set()
for md in Path('content/prompts').rglob('*.md'):
    content = md.read_text(encoding='utf-8')
    m = re.search(r'^slug:\s*["\']?([^"\'\n]+)', content, re.M)
    if m:
        md_slugs.add(m.group(1).strip())

print(f'Markdown slug 数: {len(md_slugs)}')
print(f'Markdown 文件数: {len(list(Path("content/prompts").rglob("*.md")))}')