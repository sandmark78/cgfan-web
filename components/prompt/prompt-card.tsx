import Link from 'next/link'
import type { PromptData } from '@/lib/prompts'
import { PromptImage } from './prompt-image'

interface PromptCardProps {
  prompt: PromptData
}

/**
 * 从提示词文本中提取干净的摘要（去除重复的标题）
 */
function extractSummary(prompt: PromptData): string {
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
export function PromptCard({ prompt }: PromptCardProps) {
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
    <Link
      href={`/prompt/${prompt.slug}`}
      className="glass-card group block overflow-hidden"
    >
      <div className="card-content p-4">
        {/* 封面图 */}
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <PromptImage src={prompt.cover} alt={prompt.title} />
          {/* 模型标签 */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {prompt.model}
            </span>
          </div>
          {/* 难度标签 */}
          <div className="absolute right-3 top-3">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="mt-4 line-clamp-1 text-base font-semibold text-gray-900 dark:text-white">
          {prompt.title}
        </h3>

        {/* 提示词摘要 - 统一 3 行 */}
        <p className="card-text text-gray-600 dark:text-gray-300">
          {summary}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 底部操作区 - 锁在同一基线 */}
        <div className="card-footer">
          {/* 点赞 */}
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-xs">12</span>
          </div>

          {/* 作者头像 */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {prompt.author}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
