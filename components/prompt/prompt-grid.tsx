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
export function PromptGrid({ prompts, maxRows }: PromptGridProps) {
  // 如果传了 maxRows，使用它计算；否则显示全部
  const [displayCount, setDisplayCount] = useState(() => {
    if (typeof window === 'undefined') return prompts.length
    if (maxRows === undefined) return prompts.length
    
    const width = window.innerWidth
    let cols = 1
    if (width >= 1024) cols = 3
    else if (width >= 640) cols = 2
    
    return Math.min(cols * maxRows, prompts.length)
  })

  useEffect(() => {
    if (maxRows === undefined) {
      setDisplayCount(prompts.length)
      return
    }
    
    function updateDisplayCount() {
      const rows = maxRows
      if (rows === undefined) return
      
      const width = window.innerWidth
      let cols = 1
      if (width >= 1024) cols = 3
      else if (width >= 640) cols = 2

      const count = cols * rows
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
      {displayPrompts.map((prompt, index) => (
        <PromptCard key={prompt.slug} prompt={prompt} priority={index < 6} />
      ))}
    </div>
  )
}
