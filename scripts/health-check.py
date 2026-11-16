#!/usr/bin/env python3
"""
CGfan 网站健康检查脚本
检查网站是否可访问，失败时输出错误信息
"""

import urllib.request
import urllib.error
import sys
import json
from datetime import datetime

URL = "https://www.cgfan.com"
TIMEOUT = 10

def check_health():
    """检查网站健康状态"""
    try:
        req = urllib.request.Request(
            URL,
            headers={"User-Agent": "CGfan-HealthCheck/1.0"}
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            status = response.getcode()
            if status == 200:
                print(f"✅ 网站正常 - HTTP {status} - {datetime.now().isoformat()}")
                return True
            else:
                print(f"❌ 异常状态 - HTTP {status} - {datetime.now().isoformat()}")
                return False
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP错误 - {e.code} {e.reason} - {datetime.now().isoformat()}")
        return False
    except urllib.error.URLError as e:
        print(f"❌ 连接失败 - {e.reason} - {datetime.now().isoformat()}")
        return False
    except Exception as e:
        print(f"❌ 未知错误 - {str(e)} - {datetime.now().isoformat()}")
        return False

if __name__ == "__main__":
    success = check_health()
    sys.exit(0 if success else 1)
