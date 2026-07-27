#!/usr/bin/env python3
"""
解析 Gemnana HTML 文件，提取结构化数据
"""

import os
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

def parse_html_file(html_path):
    """解析单个 HTML 文件"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 提取 ID
    case_id = Path(html_path).stem
    
    # 提取标题（从 h1.detail-title）
    h1 = soup.find('h1', class_='detail-title')
    title = ''
    if h1:
        # 从 case-title-text span 获取标题文本
        title_span = h1.find('span', class_='case-title-text')
        if title_span:
            title = title_span.get_text(strip=True)
        else:
            title_text = h1.get_text(strip=True)
            title = re.sub(r'^#\d+\s*', '', title_text)
    
    # 提取来源（X / @author）
    source = ''
    source_link = ''
    source_inline = soup.find('a', class_='source-inline-link')
    if source_inline:
        source = source_inline.get_text(strip=True)
        source_link = source_inline.get('href', '')
    
    # 提取日期 - 从包含日期的 p 标签
    date = ''
    for p in soup.find_all('p'):
        p_text = p.get_text()
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', p_text)
        if date_match:
            date = date_match.group(1)
            break
    
    # 提取所有 detail-block
    blocks = soup.find_all('div', class_='detail-block')
    
    summary = ''
    chinese_prompt = ''
    english_prompt = ''
    images = []
    tags = []
    
    for block in blocks:
        h3 = block.find('h3')
        if not h3:
            continue
        
        heading_text = h3.get_text(strip=True)
        
        # 内容摘要
        if '内容摘要' in heading_text:
            p = block.find('p')
            if p:
                summary = p.get_text(strip=True)
        
        # 中文提示词
        elif '中文提示词' in heading_text:
            # 提示词可能在 p 或 data-nosnippet div 中
            content = block.find('div', attrs={'data-nosnippet': True})
            if content:
                chinese_prompt = content.get_text('\n', strip=True)
            else:
                p = block.find('p')
                if p:
                    chinese_prompt = p.get_text(strip=True)
        
        # 英文提示词
        elif '英文提示词' in heading_text:
            content = block.find('div', attrs={'data-nosnippet': True})
            if content:
                english_prompt = content.get_text('\n', strip=True)
            else:
                p = block.find('p')
                if p:
                    english_prompt = p.get_text(strip=True)
        
        # 图片
        elif '图片' in heading_text:
            media_grid = block.find('div', class_='detail-media-grid')
            if media_grid:
                for img in media_grid.find_all('img'):
                    img_src = img.get('src', '')
                    if img_src and not img_src.startswith('data:'):
                        # 转为完整 URL
                        if img_src.startswith('/'):
                            img_src = f'https://gemnana.com{img_src}'
                        images.append(img_src)
                # 也检查 video
                for video in media_grid.find_all('video'):
                    video_src = video.get('src', '')
                    if video_src:
                        if video_src.startswith('/'):
                            video_src = f'https://gemnana.com{video_src}'
                        images.append(video_src)
    
    # 提取标签（从 meta 或页面其他位置）
    # 检查是否有 tag 相关元素
    tag_elements = soup.find_all('span', class_='tag')
    for tag_el in tag_elements:
        tag_text = tag_el.get_text(strip=True)
        if tag_text:
            tags.append(tag_text)
    
    return {
        'id': case_id,
        'title': title,
        'source': source,
        'source_link': source_link,
        'date': date,
        'summary': summary,
        'chinese_prompt': chinese_prompt,
        'english_prompt': english_prompt,
        'images': images,
        'tags': tags
    }

def main():
    html_dir = Path('html')
    output_file = Path('parsed.json')
    
    results = []
    html_files = sorted(html_dir.glob('*.html'), key=lambda x: int(x.stem))
    
    print(f"开始解析 {len(html_files)} 个 HTML 文件...")
    
    for i, html_file in enumerate(html_files, 1):
        if i % 500 == 0:
            print(f"进度: {i}/{len(html_files)}")
        
        try:
            data = parse_html_file(html_file)
            results.append(data)
        except Exception as e:
            print(f"解析失败 {html_file.name}: {e}")
    
    # 保存结果
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n解析完成！")
    print(f"总计: {len(results)} 条")
    print(f"输出: {output_file}")
    
    # 统计信息
    with_cn = sum(1 for r in results if r['chinese_prompt'])
    with_en = sum(1 for r in results if r['english_prompt'])
    with_images = sum(1 for r in results if r['images'])
    with_tags = sum(1 for r in results if r['tags'])
    with_date = sum(1 for r in results if r['date'])
    with_source = sum(1 for r in results if r['source'])
    
    print(f"\n统计:")
    print(f"  有中文提示词: {with_cn}")
    print(f"  有英文提示词: {with_en}")
    print(f"  有图片: {with_images}")
    print(f"  有标签: {with_tags}")
    print(f"  有日期: {with_date}")
    print(f"  有来源: {with_source}")
    
    # 显示几条样例
    print(f"\n样例数据（最新3条）:")
    for r in results[-3:]:
        print(f"  #{r['id']}: {r['title'][:40]}... | 图片:{len(r['images'])} | 日期:{r['date']} | 来源:{r['source']}")

if __name__ == '__main__':
    main()
