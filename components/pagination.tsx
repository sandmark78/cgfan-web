'use client'

import Link from 'next/link'

/**
 * 生成页码序列：1 ... 4 5 6 ... 10
 */
function getPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
}

interface PaginationProps {
  current: number
  total: number
  basePath: string
  params?: Record<string, string | undefined>
}

export default function Pagination({ current, total, basePath, params = {} }: PaginationProps) {
  if (total <= 1) return null

  const buildHref = (page: number) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.set(key, val)
    })
    searchParams.set('page', String(page))
    const qs = searchParams.toString()
    return `${basePath}?${qs}`
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 py-8 flex-wrap" aria-label="分页">
      {/* 上一页 */}
      <Link
        href={buildHref(current - 1)}
        className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-3 text-sm transition-all duration-200 ${
          current === 1
            ? 'pointer-events-none opacity-30'
            : 'bg-white/50 dark:bg-zinc-800/50 border border-white/50 dark:border-zinc-700/50 text-gray-700 dark:text-gray-300 hover:-translate-y-0.5 hover:bg-white/75 dark:hover:bg-zinc-700/75'
        }`}
        aria-disabled={current === 1}
        tabIndex={current === 1 ? -1 : 0}
      >
        ← 上一页
      </Link>

      {/* 页码 */}
      {getPageList(current, total).map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="flex h-10 w-6 items-center justify-center text-sm text-gray-400 dark:text-zinc-500 select-none">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-sm font-medium transition-all duration-200 ${
              p === current
                ? 'bg-green-600 text-white shadow-lg shadow-green-600/25 font-semibold scale-105'
                : 'bg-white/50 dark:bg-zinc-800/50 border border-white/50 dark:border-zinc-700/50 text-gray-600 dark:text-gray-400 hover:-translate-y-0.5 hover:bg-white/75 dark:hover:bg-zinc-700/75'
            }`}
            aria-current={p === current ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}

      {/* 下一页 */}
      <Link
        href={buildHref(current + 1)}
        className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-3 text-sm transition-all duration-200 ${
          current === total
            ? 'pointer-events-none opacity-30'
            : 'bg-white/50 dark:bg-zinc-800/50 border border-white/50 dark:border-zinc-700/50 text-gray-700 dark:text-gray-300 hover:-translate-y-0.5 hover:bg-white/75 dark:hover:bg-zinc-700/75'
        }`}
        aria-disabled={current === total}
        tabIndex={current === total ? -1 : 0}
      >
        下一页 →
      </Link>
    </nav>
  )
}