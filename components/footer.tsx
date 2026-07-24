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
          {/* 链接 - 移动端横排紧凑 */}
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
            <a href="https://github.com/cgfan" target="_blank" rel="noopener noreferrer" className="text-gray-400 transition-colors hover:text-green-600 dark:hover:text-green-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
