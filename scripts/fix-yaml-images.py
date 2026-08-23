#!/usr/bin/env python3
"""
修复 fix-multi-image-20260823.py 引入的 YAML 格式错误
问题：images 数组最后一项和 score 字段粘在一起（缺少换行）
"""
import re
from pathlib import Path

def fix_yaml(filepath: Path) -> bool:
    content = filepath.read_text()
    
    # 匹配模式：jpg"score: 或 jpg"composition: 等（images 数组最后一项和 frontmatter 字段粘连）
    # 需要在 jpg" 后面插入换行
    fixed = re.sub(
        r'(\.jpg")((?:score|composition|color|lighting|detail|creativity|technical|aesthetic|curation):)',
        r'\1\n\2',
        content
    )
    
    if fixed != content:
        filepath.write_text(fixed)
        return True
    return False

def main():
    fixed = 0
    for day_dir in sorted(Path('content/prompts/2026/08').iterdir()):
        if not day_dir.is_dir():
            continue
        for md_file in sorted(day_dir.glob('prompt-*.md')):
            if fix_yaml(md_file):
                fixed += 1
                print(f'✅ 修复: {md_file}')
    
    print(f'\n总计修复: {fixed} 个文件')
    
    if fixed > 0:
        # 验证修复结果
        print('\n验证 YAML 解析...')
        import subprocess
        result = subprocess.run(
            ['npx', 'tsx', '-e', '''
const fs = require("fs");
const matter = require("gray-matter");
const glob = require("glob");
const files = glob.sync("content/prompts/2026/08/*/prompt-*.md");
let ok = 0, fail = 0;
for (const f of files) {
  try {
    const { data } = matter(fs.readFileSync(f, "utf-8"));
    if (data.images && data.images.length > 1) ok++;
  } catch(e) { fail++; console.log("❌", f, e.message.slice(0,80)); }
}
console.log(`\\n✅ 解析成功(多图): ${ok}, ❌ 解析失败: ${fail}`);
'''],
            capture_output=True, text=True, cwd=str(Path(__file__).parent.parent)
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr[-200:])

if __name__ == '__main__':
    main()
