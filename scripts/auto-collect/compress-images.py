#!/usr/bin/env python3
"""
批量压缩图片
限制最大边 1200px，质量 85%
"""

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from config import IMAGES_DIR

def compress_image(filepath: Path) -> bool:
    """压缩单张图片"""
    try:
        # 限制最大边 1200px，质量 85%
        result = subprocess.run(
            ['sips', '-Z', '1200', '-s', 'formatOptions', '85', str(filepath)],
            capture_output=True,
            timeout=10
        )
        return result.returncode == 0
    except Exception:
        return False

def main():
    """主流程"""
    print("🗜️ 批量压缩图片")
    print("=" * 60)
    
    if not IMAGES_DIR.exists():
        print(f"❌ 目录不存在: {IMAGES_DIR}")
        return
    
    # 查找所有 jpg
    images = list(IMAGES_DIR.glob("*.jpg"))
    print(f"📥 找到 {len(images)} 张图片")
    
    compressed = 0
    failed = 0
    
    for img in images:
        if compress_image(img):
            compressed += 1
            if compressed % 100 == 0:
                print(f"  已压缩 {compressed}/{len(images)}")
        else:
            failed += 1
    
    print(f"\n✅ 压缩完成: {compressed} 成功, {failed} 失败")
    
    # 显示总大小
    total_size = sum(f.stat().st_size for f in IMAGES_DIR.glob("*.jpg"))
    print(f"📊 总大小: {total_size / 1024 / 1024:.1f} MB")

if __name__ == '__main__':
    main()
