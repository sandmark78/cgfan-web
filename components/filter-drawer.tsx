'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Filter } from 'lucide-react'

interface FilterDrawerProps {
  categories: Array<{ name: string; count: number }>
  models: string[]
  modelCounts: Record<string, number>
  difficulties: string[]
  diffCounts: Record<string, number>
  tags: Array<{ name: string; count: number }>
  currentCategory?: string
  currentModel?: string
  currentDifficulty?: string
  currentTag?: string
  currentPage?: number
}

export function FilterDrawer({
  categories,
  models,
  modelCounts,
  difficulties,
  diffCounts,
  tags,
  currentCategory,
  currentModel,
  currentDifficulty,
  currentTag,
  currentPage = 1,
}: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const buildUrl = (key: string, value: string | null) => {
    const p = new URLSearchParams()
    if (value) p.set(key, value)
    if (currentPage > 1 && key !== 'page') p.set('page', String(currentPage))
    const s = p.toString()
    return `/explore${s ? `?${s}` : ''}`
  }

  return (
    <>
      {/* 移动端筛选按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg lg:hidden"
        aria-label="打开筛选"
      >
        <Filter className="h-5 w-5" />
      </button>

      {/* 抽屉遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 抽屉内容 */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] transform bg-white p-6 shadow-2xl transition-transform duration-300 dark:bg-zinc-900 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="关闭筛选"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="mb-6 text-lg font-bold text-zinc-900 dark:text-white">筛选</h2>

        <div className="space-y-6 overflow-y-auto">
          {/* 分类 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">分类</h3>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href={buildUrl('category', null)}
                  onClick={() => setIsOpen(false)}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                    !currentCategory && !currentTag && !currentModel && !currentDifficulty
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
                >
                  全部
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.name}>
                  <Link
                    href={buildUrl('category', cat.name)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                      currentCategory === cat.name
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-zinc-600">{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 模型 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">模型</h3>
            <ul className="space-y-0.5">
              {models.map(m => (
                <li key={m}>
                  <Link
                    href={buildUrl('model', m)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                      currentModel === m
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    <span>{m}</span>
                    <span className="text-xs text-zinc-600">{modelCounts[m] || 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 难度 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">难度</h3>
            <ul className="space-y-0.5">
              {difficulties.map(d => (
                <li key={d}>
                  <Link
                    href={buildUrl('difficulty', d)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                      currentDifficulty === d
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    <span>{d}</span>
                    <span className="text-xs text-zinc-600">{diffCounts[d] || 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 标签 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 15).map(t => (
                <Link
                  key={t.name}
                  href={buildUrl('tag', t.name)}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    currentTag === t.name
                      ? 'bg-white text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}