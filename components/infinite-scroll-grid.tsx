'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { PromptCard } from '@/components/prompt/prompt-card'

interface PromptData {
  slug: string
  title: string
  model: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  cover: string
  images?: string[]
  date: string
  added: string
  source: string
  sourceLink: string
  author: string
  authorLink?: string
  prompt: string
  negativePrompt: string
  parameters: Record<string, string>
  promptDNA?: any
}

interface InfiniteScrollGridProps {
  initialPrompts: PromptData[]
  initialPage: number
  initialHasMore: boolean
  filters: {
    category?: string
    tag?: string
    q?: string
    model?: string
    difficulty?: string
  }
}

export function InfiniteScrollGrid({ initialPrompts, initialPage, initialHasMore, filters }: InfiniteScrollGridProps) {
  const [prompts, setPrompts] = useState<PromptData[]>(initialPrompts)
  const [page, setPage] = useState(initialPage)
  const [offset, setOffset] = useState(initialPrompts.length) // 当前页内已加载数量
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    const params = new URLSearchParams({
      page: String(page),
      offset: String(offset),
      limit: '20'
    })
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    try {
      const res = await fetch(`/api/prompts?${params.toString()}`)
      const data = await res.json()

      if (data.prompts && data.prompts.length > 0) {
        setPrompts(prev => [...prev, ...data.prompts])
        setOffset(data.offset)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('加载失败:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [page, offset, loading, hasMore, filters])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, loading])

  // 当 filters 或 page 变化时重置
  useEffect(() => {
    setPrompts(initialPrompts)
    setPage(initialPage)
    setOffset(initialPrompts.length)
    setHasMore(initialHasMore)
  }, [initialPrompts, initialPage, initialHasMore])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt, index) => (
          <div
            key={prompt.slug}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % 20) * 50}ms` }}
          >
            <PromptCard prompt={{
              ...prompt,
              editorPick: (prompt as any).editor_pick || false
            }} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="py-8 text-center">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-zinc-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>加载中...</span>
            </div>
          ) : (
            <button onClick={loadMore} className="btn-secondary">
              加载更多
            </button>
          )}
        </div>
      )}

      {!hasMore && prompts.length > 0 && (
        <div className="py-8 text-center text-sm text-zinc-500">
          已加载全部 {prompts.length} 条提示词
        </div>
      )}
    </>
  )
}
