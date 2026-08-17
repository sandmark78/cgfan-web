import Link from 'next/link'

/**
 * 页脚 - 毛玻璃胶囊
 */
export default function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl px-4 pb-8">
      <div className="glass rounded-2xl px-6 py-3">
        <div className="flex flex-col items-center gap-1.5">
          {/* 导航 + 版权 */}
          <div className="flex flex-wrap items-center justify-center divide-x divide-gray-300 dark:divide-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/about" className="px-3 first:pl-0 transition-colors hover:text-green-600 dark:hover:text-green-400">
              关于
            </Link>
            <Link href="/contact" className="px-3 transition-colors hover:text-green-600 dark:hover:text-green-400">
              联系
            </Link>
            <Link href="/terms" className="px-3 transition-colors hover:text-green-600 dark:hover:text-green-400">
              条款
            </Link>
            <Link href="/copyright" className="px-3 transition-colors hover:text-green-600 dark:hover:text-green-400">
              版权
            </Link>
            <span className="px-3 last:pr-0">© 2026 CGfan.com</span>
          </div>

          {/* 友情链接 */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            友情链接：
            <a
              href="https://deepmess.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-green-600 dark:hover:text-green-400"
            >
              DeepMess
            </a>
          </p>

          {/* 免责声明 */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-500 opacity-80">
            提示词与示例图收集自 X 公开内容，版权归原作者，仅供学习交流。如有侵权请联系删除。
          </p>
        </div>
      </div>
    </footer>
  )
}
