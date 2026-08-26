#!/usr/bin/env python3
"""修复 prompt-2092183407778509243 的 prompt 内容"""
import json, re
from pathlib import Path

WORKDIR = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

with open(WORKDIR / "data/auto-collect/tweets_batch.json") as f:
    tweets = json.load(f)

for item in tweets:
    if item.get("id") == "2092183407778509243":
        alltext = item.get("allText", "")
        # 提取 ARTICLE 0
        m = re.search(r"===ARTICLE 0===\s*(.*?)(?====ARTICLE|$)", alltext, re.DOTALL)
        text = m.group(1)
        
        # 找到第一个代码块中的 prompt
        # 格式: ```\n😁🙂😋\n\n请将我上传...\n\n🥲😜🥰\n```
        code_blocks = re.findall(r"```(.*?)```", text, re.DOTALL)
        
        best_prompt = ""
        for block in code_blocks:
            # 清理表情符号行
            lines = []
            for line in block.split("\n"):
                s = line.strip()
                if not s:
                    continue
                # 跳过纯表情行
                if re.match(r"^[\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF\s]+$", s):
                    continue
                if len(s) < 3:
                    continue
                lines.append(line)
            cleaned = "\n".join(lines).strip()
            if len(cleaned) > len(best_prompt):
                best_prompt = cleaned
        
        if best_prompt:
            print(f"提取到 {len(best_prompt)} 字符")
            print(f"前200字: {best_prompt[:200]}")
            
            # 写入 markdown
            md_path = WORKDIR / "content/prompts/2026/08/26/prompt-2092183407778509243.md"
            content = md_path.read_text(encoding="utf-8")
            new_content = re.sub(
                r"## Prompt\s*\n.*?(?=\n## |\Z)",
                f"## Prompt\n\n{best_prompt}\n",
                content,
                flags=re.DOTALL
            )
            md_path.write_text(new_content, encoding="utf-8")
            print("✅ 已更新")
        else:
            print("❌ 未找到有效 prompt")
        break
