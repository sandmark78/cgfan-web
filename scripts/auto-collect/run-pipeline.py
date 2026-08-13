#!/usr/bin/env python3
"""
自动采集流水线编排
串联所有步骤：fetch → preprocess → evaluate → generate → download → deploy
"""

import subprocess
import sys
import json
from pathlib import Path
from datetime import datetime

# 导入共享配置
sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_DIR, TWEETS_BATCH, PREPROCESSED, EVALUATED, PROJECT_ROOT

SCRIPTS_DIR = Path(__file__).parent

def log(msg: str):
    """带时间戳的日志"""
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}", flush=True)

def run_script(script_name: str) -> bool:
    """运行脚本，返回是否成功"""
    script_path = SCRIPTS_DIR / script_name
    if not script_path.exists():
        log(f"❌ 脚本不存在: {script_path}")
        return False
    
    log(f"▶ 运行: {script_name}")
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(PROJECT_ROOT)
        )
        
        if result.returncode != 0:
            log(f"❌ {script_name} 失败:")
            log(result.stderr[-500:] if len(result.stderr) > 500 else result.stderr)
            return False
        
        # 打印关键输出
        lines = result.stdout.strip().split('\n')
        for line in lines[-10:]:  # 最后10行
            if line.strip():
                log(f"  {line}")
        
        log(f"✅ {script_name} 完成")
        return True
    
    except subprocess.TimeoutExpired:
        log(f"❌ {script_name} 超时(300s)")
        return False
    except Exception as e:
        log(f"❌ {script_name} 异常: {e}")
        return False

def check_data_file(path: Path, min_items: int = 0) -> bool:
    """检查数据文件是否存在且有效"""
    if not path.exists():
        log(f"❌ 数据文件不存在: {path}")
        return False
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            log(f"❌ 数据文件格式错误: {path}")
            return False
        
        if len(data) < min_items:
            log(f"⚠️ 数据文件为空: {path} ({len(data)} 条)")
            return False
        
        log(f"✅ 数据文件有效: {path.name} ({len(data)} 条)")
        return True
    
    except Exception as e:
        log(f"❌ 数据文件读取失败: {path} - {e}")
        return False

def main():
    """主流程"""
    log("=" * 60)
    log("🚀 CGfan 自动采集流水线")
    log("=" * 60)
    
    start_time = datetime.now()
    
    # 步骤1: 抓取推文
    log("\n【步骤1/6】抓取推文")
    if not run_script('fetch-tweets.py'):
        log("❌ 流水线中断: 抓取失败")
        sys.exit(1)
    
    if not check_data_file(TWEETS_BATCH):
        log("❌ 流水线中断: 抓取数据无效")
        sys.exit(1)
    
    # 步骤2: 预处理
    log("\n【步骤2/6】预处理")
    if not run_script('preprocess.py'):
        log("❌ 流水线中断: 预处理失败")
        sys.exit(1)
    
    if not check_data_file(PREPROCESSED):
        log("❌ 流水线中断: 预处理数据无效")
        sys.exit(1)
    
    # 步骤3: 评估
    log("\n【步骤3/6】规则化评估")
    if not run_script('auto-evaluate.py'):
        log("❌ 流水线中断: 评估失败")
        sys.exit(1)
    
    if not check_data_file(EVALUATED):
        log("❌ 流水线中断: 评估数据无效")
        sys.exit(1)
    
    # 检查是否有通过评估的内容
    with open(EVALUATED, 'r', encoding='utf-8') as f:
        evaluated = json.load(f)
    
    passed = [item for item in evaluated if item.get('status') == 'pass']
    if not passed:
        log("⚠️ 没有通过评估的内容，流水线结束")
        sys.exit(0)
    
    log(f"✅ {len(passed)} 条内容通过评估")
    
    # 步骤4: 生成 Markdown
    log("\n【步骤4/6】生成 Markdown")
    if not run_script('generate-markdown.py'):
        log("❌ 流水线中断: 生成失败")
        sys.exit(1)
    
    # 步骤5: 下载图片
    log("\n【步骤5/6】下载图片")
    if not run_script('download-images.py'):
        log("⚠️ 图片下载有失败，继续部署")
    
    # 步骤6: 部署
    log("\n【步骤6/6】部署")
    log("▶ 运行: npm run prebuild")
    
    try:
        result = subprocess.run(
            ['npm', 'run', 'prebuild'],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=str(PROJECT_ROOT)
        )
        
        if result.returncode != 0:
            log(f"❌ prebuild 失败:")
            log(result.stderr[-500:] if len(result.stderr) > 500 else result.stderr)
            sys.exit(1)
        
        # 打印关键输出
        lines = result.stdout.strip().split('\n')
        for line in lines[-10:]:
            if line.strip():
                log(f"  {line}")
        
        log("✅ prebuild 完成")
    
    except subprocess.TimeoutExpired:
        log("❌ prebuild 超时(300s)")
        sys.exit(1)
    except Exception as e:
        log(f"❌ prebuild 异常: {e}")
        sys.exit(1)
    
    # Git 提交
    log("▶ Git 提交")
    try:
        # 检查是否有变更
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            cwd=str(PROJECT_ROOT)
        )
        
        if not result.stdout.strip():
            log("⚠️ 没有文件变更，跳过提交")
        else:
            # 添加文件
            subprocess.run(['git', 'add', '-A'], cwd=str(PROJECT_ROOT), check=True)
            
            # 提交
            date_str = datetime.now().strftime('%Y-%m-%d')
            count = len(passed)
            commit_msg = f"feat: 自动采集 {count} 条新提示词 ({date_str})"
            subprocess.run(
                ['git', 'commit', '-m', commit_msg],
                cwd=str(PROJECT_ROOT),
                check=True
            )
            log(f"✅ 提交完成: {commit_msg}")
            
            # 推送
            log("▶ Git 推送")
            result = subprocess.run(
                ['git', 'push', 'origin', 'main'],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(PROJECT_ROOT)
            )
            
            if result.returncode != 0:
                log(f"⚠️ Git 推送失败: {result.stderr[-200:]}")
            else:
                log("✅ Git 推送完成")
    
    except subprocess.TimeoutExpired:
        log("⚠️ Git 推送超时(120s)")
    except subprocess.CalledProcessError as e:
        log(f"⚠️ Git 操作失败: {e}")
    except Exception as e:
        log(f"⚠️ Git 异常: {e}")
    
    # 完成
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    log("\n" + "=" * 60)
    log(f"✅ 流水线完成，耗时 {duration:.1f}s")
    log(f"   通过评估: {len(passed)} 条")
    log("=" * 60)

if __name__ == '__main__':
    main()
