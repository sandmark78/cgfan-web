'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PromptImage } from './prompt-image'

interface PromptCardProps {
  prompt: {
    slug: string
    title: string
    cover: string
    model: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    tags: string[]
    prompt: string
    negativePrompt?: string
    author?: string
    likeCount?: number
  }
  priority?: boolean
}

/**
 * 从提示词文本中提取干净的摘要（去除重复的标题）
 */
function extractSummary(prompt: PromptCardProps['prompt']): string {
  const fullText = prompt.prompt || ''
  const title = prompt.title || ''
  
  // 如果提示词以标题开头，去除标题部分
  let summary = fullText
  if (title && fullText.startsWith(title)) {
    summary = fullText.slice(title.length).trim()
  }
  
  // 如果去除后太短，尝试从其他字段提取
  if (summary.length < 50) {
    // 尝试从 negativePrompt 提取
    if (prompt.negativePrompt && prompt.negativePrompt.length > 50) {
      return prompt.negativePrompt.slice(0, 150) + '...'
    }
    // 否则返回原始提示词（截断）
    return fullText.length > 150 ? fullText.slice(0, 150) + '...' : fullText
  }
  
  // 截断到 150 字符
  return summary.length > 150 ? summary.slice(0, 150) + '...' : summary
}

/**
 * 提示词卡片 - 毛玻璃效果 + 整齐对齐
 */
export function PromptCard({ prompt, priority = false }: PromptCardProps) {
  const [likeCount, setLikeCount] = useState(prompt.likeCount || 0)
  const supabase = createClient()

  // 从 Supabase 获取实时点赞数
  useEffect(() => {
    const fetchLikeCount = async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_slug', prompt.slug)

      if (count !== null) {
        setLikeCount(count)
      }
    }

    fetchLikeCount()
  }, [prompt.slug, supabase])
  const difficultyLabel = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  }[prompt.difficulty]

  const difficultyColor = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[prompt.difficulty]

  const summary = extractSummary(prompt)

  return (
    <article className="glass-card group relative overflow-hidden rounded-2xl">
      <Link
        href={`/prompt/${prompt.slug}`}
        className="block"
        aria-label={`查看 ${prompt.title} 的完整提示词`}
      >
        {/* 封面图 */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PromptImage src={prompt.cover} alt={prompt.title} priority={priority} />
          
          {/* 模型标签 */}
          <div className="absolute top-3 left-3 z-10">
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {prompt.model}
            </span>
          </div>

          {/* 难度标签 */}
          <div className="absolute top-3 right-3 z-10">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>
        </div>

        {/* 内容区 */}
        <div className="p-4">
          {/* 标题 */}
          <h3 className="mb-2 line-clamp-1 text-base font-semibold text-gray-900 dark:text-white">
            {prompt.title}
          </h3>

          {/* 摘要 */}
          <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {summary}
          </p>

          {/* 标签 */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {prompt.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
              <span className="text-xs">{prompt.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
