#!/usr/bin/env python3
"""
修复剩余评分问题（第三轮）
从 scoreDetail 字符串提取维度，处理各种格式
"""
import re
from pathlib import Path

DIM_MAP = {
    '构图': 'composition', '色彩': 'color', '光影': 'lighting',
    '细节': 'detail', '创意': 'creativity', '技术': 'technical',
    '审美': 'aesthetic', '策展': 'curation',
}

def extract_from_score_detail(detail: str) -> dict:
    """从 scoreDetail 字符串提取维度分数"""
    dims = {}
    # 匹配 "构图9" 或 "构图 9" 或 "构图:9"
    for cn, en in DIM_MAP.items():
        m = re.search(rf'{cn}\s*[:：]?\s*(\d+)', detail)
        if m:
            dims[en] = int(m.group(1))
    return dims

def fix_file(md_file: Path) -> bool:
    content = md_file.read_text()
    original = content
    
    # 提取 score
    score_match = re.search(r'^score:\s*(\d+)', content, re.MULTILINE)
    if not score_match:
        return False
    score = int(score_match.group(1))
    
    # 提取已有维度
    dims = {}
    for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
        m = re.search(rf'^{dim}:\s*(\d+)', content, re.MULTILINE)
        if m:
            dims[dim] = int(m.group(1))
    
    # 问题1：缺少维度，尝试从 scoreDetail 提取
    if len(dims) < 8:
        detail_match = re.search(r'^scoreDetail:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
        if detail_match:
            extracted = extract_from_score_detail(detail_match.group(1))
            if len(extracted) >= 6:
                dims = extracted
        
        # 还是不够，用平均分估算
        if len(dims) < 8:
            avg = score / 8
            for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
                if dim not in dims:
                    dims[dim] = round(avg)
            # 调整总和
            diff = score - sum(dims.values())
            if diff != 0:
                dims['creativity'] = max(1, dims.get('creativity', 7) + diff)
    
    # 问题2：多个10分
    ten_count = sum(1 for v in dims.values() if v >= 10)
    if ten_count > 1:
        first = True
        for dim in dims:
            if dims[dim] >= 10:
                if first:
                    first = False
                else:
                    dims[dim] = 9
    
    # 问题3：所有维度≥8
    if all(v >= 8 for v in dims.values()):
        min_dim = min(dims, key=dims.get)
        dims[min_dim] = 7
    
    # 问题4：总分>72
    current_sum = sum(dims.values())
    if current_sum > 72:
        scale = 72 / current_sum
        dims = {k: max(1, round(v * scale)) for k, v in dims.items()}
        diff = 72 - sum(dims.values())
        if diff != 0:
            dims['creativity'] = max(1, dims.get('creativity', 7) + diff)
    
    # 确保总分=维度之和
    new_score = sum(dims.values())
    
    # 检查是否有变化
    if new_score == score and len(dims) == 8:
        return False
    
    # 更新文件
    # 替换 score
    content = re.sub(r'^score:\s*\d+', f'score: {new_score}', content, flags=re.MULTILINE)
    
    # 删除 scoreDetail（如果存在）
    content = re.sub(r'^scoreDetail:\s*.+\n', '', content, flags=re.MULTILINE)
    
    # 更新或添加维度字段
    has_dims = bool(re.search(r'^composition:', content, re.MULTILINE))
    
    if has_dims:
        for dim in ['composition', 'color', 'lighting', 'detail', 'creativity', 'technical', 'aesthetic', 'curation']:
            content = re.sub(rf'^{dim}:\s*\d+', f'{dim}: {dims[dim]}', content, flags=re.MULTILINE)
    else:
        # 在 score: 行后面插入维度
        dim_block = (
            f"\ncomposition: {dims['composition']}\n"
            f"color: {dims['color']}\n"
            f"lighting: {dims['lighting']}\n"
            f"detail: {dims['detail']}\n"
            f"creativity: {dims['creativity']}\n"
            f"technical: {dims['technical']}\n"
            f"aesthetic: {dims['aesthetic']}\n"
            f"curation: {dims['curation']}\n"
        )
        content = re.sub(r'(^score:\s*\d+\n)', r'\1' + dim_block, content, flags=re.MULTILINE)
    
    if content != original:
        md_file.write_text(content)
        return True
    return False

def main():
    fixed = 0
    for md_file in sorted(Path('content/prompts').rglob('*.md')):
        try:
            if fix_file(md_file):
                fixed += 1
                print(f'✅ {md_file}')
        except Exception as e:
            print(f'❌ {md_file}: {e}')
    
    print(f'\n总计修复: {fixed} 个文件')

if __name__ == '__main__':
    main()
