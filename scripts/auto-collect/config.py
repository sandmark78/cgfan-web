#!/usr/bin/env python3
"""
共享配置：路径、常量、过滤规则
所有自动采集脚本统一从这里导入，避免路径散落各处。
"""

import os
from pathlib import Path

# ====== 项目路径 ======
PROJECT_ROOT = Path("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")
SCRIPTS_DIR = PROJECT_ROOT / "scripts" / "auto-collect"
DATA_DIR = PROJECT_ROOT / "data" / "auto-collect"
PROMPTS_DIR = PROJECT_ROOT / "content" / "prompts"
IMAGES_DIR = PROJECT_ROOT / "public" / "images" / "prompts"

# 中间数据文件（全部放 data/，不放 /tmp）
TWEETS_BATCH = DATA_DIR / "tweets_batch.json"
PREPROCESSED = DATA_DIR / "preprocessed.json"
EVALUATED = DATA_DIR / "evaluated.json"

# 确保 data 目录存在
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ====== 采集门槛 ======
MIN_SCORE = 60  # 低于此分数不收录

# ====== 内容过滤规则 ======
# 过滤掉的内容类型（正则关键词）
FILTER_PATTERNS = {
    '私房写真': ['私房写真', '私房摄影', 'boudoir'],
    'COS写真': ['cos写真', 'cosplay写真', 'cos摄影'],
    '纯人像写真': [],  # 需要组合判断，见 should_filter()
    '视频内容': ['mp4', 'mov', 'video'],
}

# 人像例外（含这些关键词的人像 → 保留）
PORTRAIT_EXCEPTIONS = ['古风', '仙侠', '电影感', '复古', 'y2k', 'ccd', '胶片', '武侠', '国风']

def should_filter(prompt: str, has_video: bool = False) -> tuple[bool, str]:
    """
    判断是否应该过滤。
    返回 (是否过滤, 过滤原因)
    """
    if has_video:
        return True, '视频内容'
    
    prompt_lower = prompt.lower()
    
    # 私房写真
    if any(kw in prompt for kw in FILTER_PATTERNS['私房写真']):
        return True, '私房写真'
    
    # COS写真
    if any(kw in prompt_lower for kw in [kw.lower() for kw in FILTER_PATTERNS['COS写真']]):
        return True, 'COS写真'
    
    # 纯人像写真（不含古风/仙侠/电影感）
    is_portrait = any(kw in prompt for kw in ['人像写真', '人像摄影'])
    has_exception = any(kw in prompt for kw in PORTRAIT_EXCEPTIONS)
    if is_portrait and not has_exception:
        return True, '纯人像写真'
    
    return False, ''
