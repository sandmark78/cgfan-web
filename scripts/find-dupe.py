import re
from pathlib import Path

slug = 'prompt-2082289107217383559'
for md in Path('content/prompts').rglob('*.md'):
    content = md.read_text(encoding='utf-8')
    m = re.search(r'^slug:\s*["\']?([^"\'\n]+)', content, re.M)
    if m and m.group(1).strip() == slug:
        print(f'文件: {md}')
        # 打印标题
        tm = re.search(r'^title:\s*["\']?(.+)', content, re.M)
        if tm:
            print(f'  标题: {tm.group(1).strip()}')
        # 打印前五行
        lines = content.split('\n')[:10]
        for l in lines:
            print(f'  {l}')
        print()