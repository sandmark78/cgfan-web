#!/usr/bin/env python3
"""
使用camofox提取推文图片和ALT text
"""
import subprocess
import json
import time
import os

os.chdir("/Users/mac/.hermes/profiles/cgfan/workspace/cgfan-web")

TWEETS = [
    "2083553455633793081",
    "2083562940922560985",
    "2083844472719516037",
    "2083573423197053147",
    "2083838916579217887",
    "2083709124253282336",
    "2082064068534530093",
    "2083872906409627939",
    "2083814556506419626",
    "2082099757267460518",
    "2083824631962820999",
    "2083613766919331971",
]

def run_camofox(cmd):
    """执行camofox命令"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    return result.stdout.strip()

def extract_images(tweet_id):
    """提取推文的图片和ALT text"""
    url = f"https://x.com/i/status/{tweet_id}"
    
    # 打开页面
    open_result = run_camofox(f'camofox open "{url}"')
    if "tabId:" not in open_result:
        print(f"❌ 无法打开 {tweet_id}")
        return None
    
    tab_id = open_result.split("tabId:")[1].strip()
    time.sleep(3)  # 等待页面加载
    
    # 提取图片
    js_code = """JSON.stringify(Array.from(document.querySelectorAll('article img')).filter(img => img.src.includes('pbs.twimg.com/media')).map(img => ({src: img.src, alt: img.alt})))"""
    
    eval_result = run_camofox(f'camofox eval {tab_id} "{js_code}"')
    
    # 关闭tab
    run_camofox(f'camofox close {tab_id}')
    
    try:
        # 解析结果
        if eval_result.startswith("ok:"):
            json_str = eval_result.split("result:")[1].strip()
            images = json.loads(json_str)
            return images
    except Exception as e:
        print(f"❌ 解析失败 {tweet_id}: {e}")
    
    return None

def download_image(url, output_path):
    """下载图片"""
    # 转换为jpg格式
    if "format=webp" in url:
        url = url.replace("format=webp", "format=jpg")
    if "name=small" in url or "name=medium" in url:
        url = url.replace("name=small", "name=large").replace("name=medium", "name=large")
    
    cmd = f'curl -s -L -o "{output_path}" "{url}"'
    subprocess.run(cmd, shell=True, timeout=30)
    
    # 检查文件
    if os.path.exists(output_path):
        size = os.path.getsize(output_path)
        if size > 1000:
            return True
    
    return False

def main():
    print("🚀 开始提取图片和ALT text...")
    
    results = []
    
    for tweet_id in TWEETS:
        print(f"\n📥 处理 {tweet_id}...")
        
        images = extract_images(tweet_id)
        
        if images and len(images) > 0:
            # 下载第一张图片
            img_url = images[0]["src"]
            alt_text = images[0].get("alt", "")
            
            output_path = f"public/images/prompts/prompt-{tweet_id}.jpg"
            
            if download_image(img_url, output_path):
                print(f"✅ 下载成功: {output_path}")
                results.append({
                    "tweet_id": tweet_id,
                    "image_url": img_url,
                    "alt_text": alt_text,
                    "downloaded": True
                })
            else:
                print(f"❌ 下载失败: {tweet_id}")
                results.append({
                    "tweet_id": tweet_id,
                    "image_url": img_url,
                    "alt_text": alt_text,
                    "downloaded": False
                })
        else:
            print(f"⚠️ 未找到图片: {tweet_id}")
            results.append({
                "tweet_id": tweet_id,
                "downloaded": False
            })
        
        time.sleep(1)  # 避免请求过快
    
    # 保存结果
    with open("/tmp/image_extraction_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 完成! 结果已保存到 /tmp/image_extraction_results.json")
    
    # 统计
    success = sum(1 for r in results if r.get("downloaded"))
    print(f"📊 成功: {success}/{len(TWEETS)}")

if __name__ == "__main__":
    main()
