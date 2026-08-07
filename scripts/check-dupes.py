import re
from pathlib import Path
from collections import Counter

slugs = []
for md in sorted(Path('content/prompts').rglob('*.md')):
    content = md.read_text(encoding='utf-8')
    m = re.search(r'^slug:\s*["\']?([^"\'\n]+)', content, re.M)
    if m:
        slugs.append(m.group(1).strip())

dupes = {s: c for s, c in Counter(slugs).items() if c > 1}
if dupes:
    print(f'重复slug: {len(dupes)}个')
    for s, c in sorted(dupes.items(), key=lambda x: -x[1])[:10]:
        print(f'  {s}: {c}次')
else:
    print('markdown文件中无重复slug')

print(f'总slug数: {len(slugs)}')
print(f'唯一slug数: {len(set(slugs))}')