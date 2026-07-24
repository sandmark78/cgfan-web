import Link from 'next/link'
import { getAllPrompts } from '@/lib/prompts'

/**
 * 404 页面 - 提供搜索和热门推荐
 */
export default function NotFound() {
  // 获取热门提示词（按点赞数排序）
  const allPrompts = getAllPrompts()
  const popularPrompts = allPrompts.slice(0, 4) // 取前4个作为推荐

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* 404 标题 */}
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-white">
          404
        </h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          页面不存在或已被移除
        </p>
      </div>

      {/* 搜索框 */}
      <div className="mx-auto mb-12 max-w-md">
        <form action="/explore" method="GET" className="relative">
          <input
            type="text"
            name="q"
            placeholder="搜索提示词..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-12 text-gray-900 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-green-500"
          />
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </form>
      </div>

      {/* 热门推荐 */}
      <div>
        <h2 className="mb-6 text-center text-xl font-semibold text-gray-900 dark:text-white">
          热门推荐
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularPrompts.map((prompt) => (
            <Link
              key={prompt.slug}
              href={`/prompt/${prompt.slug}`}
              className="group overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-green-500 hover:shadow-lg dark:border-gray-700 dark:hover:border-green-500"
            >
              <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                {prompt.cover ? (
                  <img
                    src={prompt.cover}
                    alt={prompt.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-gray-400">
                    🎨
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                  {prompt.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                    {prompt.model}
                  </span>
                  <span>❤️ {prompt.likeCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition-colors hover:bg-green-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  )
}
