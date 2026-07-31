#!/usr/bin/env python3
"""
采集结果通知脚本
通过 Telegram Bot API 发送采集状态通知
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from datetime import datetime

# Telegram Bot 配置
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '773172564')  # 默认发送到主聊天

def extract_stats(log_file):
    """从日志中提取统计信息"""
    stats = {
        'authors': 0,
        'tweets': 0,
        'accepted': 0,
        'rejected': 0,
        'duplicate': 0,
    }
    
    if not Path(log_file).exists():
        return stats
    
    with open(log_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取作者数
    m = re.search(r'共 (\d+) 位作者', content)
    if m:
        stats['authors'] = int(m.group(1))
    
    # 提取推文数
    m = re.search(r'共 (\d+) 条去重后的新推文', content)
    if m:
        stats['tweets'] = int(m.group(1))
    
    # 提取处理结果
    m = re.search(r'✅ 已接受: (\d+)', content)
    if m:
        stats['accepted'] = int(m.group(1))
    
    m = re.search(r'❌ 已拒绝: (\d+)', content)
    if m:
        stats['rejected'] = int(m.group(1))
    
    m = re.search(r'🔄 已去重: (\d+)', content)
    if m:
        stats['duplicate'] = int(m.group(1))
    
    return stats

def send_telegram(message):
    """发送 Telegram 消息"""
    if not BOT_TOKEN:
        print("⚠️ 未配置 TELEGRAM_BOT_TOKEN，跳过通知")
        return False
    
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    data = {
        'chat_id': CHAT_ID,
        'text': message,
        'parse_mode': 'Markdown',
        'disable_web_page_preview': True,
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read())
            return result.get('ok', False)
    except Exception as e:
        print(f"⚠️ 发送通知失败: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='采集结果通知')
    parser.add_argument('--status', choices=['ok', 'fail', 'empty'], required=True)
    parser.add_argument('--step', choices=['fetch', 'process'], help='失败步骤')
    parser.add_argument('--log', required=True, help='日志文件路径')
    args = parser.parse_args()
    
    stats = extract_stats(args.log)
    date = datetime.now().strftime('%Y-%m-%d')
    
    if args.status == 'ok':
        message = f"""🤖 *CGfan 自动采集完成*

📅 {date}
👤 作者: {stats['authors']} 位
📊 新推文: {stats['tweets']} 条
✅ 已收录: {stats['accepted']} 条
❌ 已拒绝: {stats['rejected']} 条
🔄 已去重: {stats['duplicate']} 条

{'🎉 采集成功！' if stats['accepted'] > 0 else '⚠️ 无新增内容'}"""
    
    elif args.status == 'fail':
        step_name = '抓取推文' if args.step == 'fetch' else '处理提示词'
        message = f"""🤖 *CGfan 自动采集失败*

📅 {date}
❌ 失败步骤: {step_name}
📄 日志: {args.log}

请检查日志排查问题。"""
    
    elif args.status == 'empty':
        message = f"""🤖 *CGfan 自动采集*

📅 {date}
⚠️ 无新推文需要处理"""
    
    # 发送通知
    if send_telegram(message):
        print("✅ 通知已发送")
    else:
        print("⚠️ 通知发送失败（非致命错误）")

if __name__ == '__main__':
    main()
