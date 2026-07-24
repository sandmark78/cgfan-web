'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { PromptCard } from '@/components/prompt/prompt-card'

interface PromptData {
  slug: string
  title: string
  author: string
  date: string
  model: string
  category: string
  tags: string[]
  difficulty: 'intermediate' | 'advanced' | 'beginner'
  cover: string
  source: string
  prompt: string
}

interface InfiniteGridProps {
  initialPrompts: PromptData[]
  category?: string
  tag?: string
  q?: string
}

export function InfiniteGrid({ initialPrompts, category, tag, q }: InfiniteGridProps) {
  const [prompts, setPrompts] = useState<PromptData[]>(initialPrompts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const nextPage = page + 1

    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        pageSize: '20',
      })
      if (category) params.append('category', category)
      if (tag) params.append('tag', tag)
      if (q) params.append('q', q)

      const res = await fetch(`/api/prompts?${params}`)
      const data = await res.json()

      if (data.prompts.length > 0) {
        setPrompts((prev) => [...prev, ...data.prompts])
        setPage(nextPage)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more prompts:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, category, tag, q])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore, hasMore, loading])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt, index) => (
          <div
            key={prompt.slug}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % 20) * 50}ms` }}
          >
            <PromptCard prompt={prompt} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {!hasMore && prompts.length > 0 && (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          — 到底啦，共 {prompts.length} 个提示词 —
        </div>
      )}
    </div>
  )
}
