import Link from 'next/link'

/**
 * 页脚 - 响应式毛玻璃效果
 */
export default function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-8">
      {/* 移动端：圆角矩形，桌面端：胶囊形 */}
      <div className="glass rounded-3xl md:rounded-full px-6 py-5 md:py-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-6">
          {/* 链接 */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/about" className="transition-colors hover:text-green-600 dark:hover:text-green-400">
              关于
            </Link>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <Link href="/contact" className="transition-colors hover:text-green-600 dark:hover:text-green-400">
              联系
            </Link>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <Link href="/terms" className="transition-colors hover:text-green-600 dark:hover:text-green-400">
              条款
            </Link>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <Link href="/copyright" className="transition-colors hover:text-green-600 dark:hover:text-green-400">
              版权
            </Link>
          </div>

          {/* 版权声明 */}
          <div className="text-xs text-gray-500 dark:text-gray-500 md:text-sm text-center md:text-right">
            <p>© 2026 CGfan.com</p>
            <p className="mt-1 text-xs opacity-80">
              提示词与示例图收集自 X 公开内容，版权归原作者，仅供学习交流。如有侵权请联系删除。
            </p>
          </div>

          {/* 社交图标 */}
          <div className="flex items-center gap-4">
            <a href="https://x.com/cgfan_ai" target="_blank" rel="noopener noreferrer" className="text-gray-400 transition-colors hover:text-green-600 dark:hover:text-green-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="/daily/feed.xml" target="_blank" rel="noopener noreferrer" className="text-gray-400 transition-colors hover:text-green-600 dark:hover:text-green-400" title="RSS 订阅">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.199 24C19.199 13.467 10.533 4.801 0 4.801V0c13.256 0 24 10.744 24 24h-4.801zM5.137 24c0-3.159-2.578-5.737-5.737-5.737V13.45c5.824 0 10.55 4.726 10.55 10.55H5.137zM4.5 21.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
