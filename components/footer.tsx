import Link from 'next/link'

/**
 * 页脚 - 两栏布局
 */
export default function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-8">
      <div className="glass rounded-3xl md:rounded-full px-6 py-5 md:py-4">
        <div className="flex flex-col items-center gap-3">
          {/* 第一行：链接 + 版权，居中 */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="text-gray-400 dark:text-gray-600">友链</span>
            <a
              href="https://deepmess.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-green-600 dark:hover:text-green-400"
            >
              DeepMess
            </a>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span>© 2026 CGfan.com</span>
          </div>

          {/* 第二行：免责声明，居中 */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-500 opacity-80">
            提示词与示例图收集自 X 公开内容，版权归原作者，仅供学习交流。如有侵权请联系删除。
          </p>
        </div>
      </div>
    </footer>
  )
}
