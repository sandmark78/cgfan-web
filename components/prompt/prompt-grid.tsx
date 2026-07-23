'use client'

import { useState, useEffect } from 'react'
import { PromptCard } from './prompt-card'
import type { PromptData } from '@/lib/prompts'

interface PromptGridProps {
  prompts: PromptData[]
  maxRows?: number
}

/**
 * 响应式网格画廊 - 根据屏幕宽度自动调整显示数量
 */
export function PromptGrid({ prompts, maxRows = 3 }: PromptGridProps) {
  const [displayCount, setDisplayCount] = useState(prompts.length)

  useEffect(() => {
    function updateDisplayCount() {
      const width = window.innerWidth
      let cols = 1
      if (width >= 1024) cols = 3
      else if (width >= 640) cols = 2

      // 根据列数和最大行数计算显示数量
      const count = cols * maxRows
      setDisplayCount(Math.min(count, prompts.length))
    }

    updateDisplayCount()
    window.addEventListener('resize', updateDisplayCount)
    return () => window.removeEventListener('resize', updateDisplayCount)
  }, [prompts.length, maxRows])

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl">🔍</div>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">暂无提示词</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">内容即将上线，敬请期待...</p>
      </div>
    )
  }

  const displayPrompts = prompts.slice(0, displayCount)

  return (
    <div className="grid-uniform">
      {displayPrompts.map((prompt) => (
        <PromptCard key={prompt.slug} prompt={prompt} />
      ))}
    </div>
  )
}
