import { PromptCard } from './prompt-card'
import type { PromptData } from '@/lib/prompts'

interface PromptGridProps {
  prompts: PromptData[]
}

/**
 * 整齐网格画廊 - 所有卡片等高对齐
 */
export function PromptGrid({ prompts }: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl">🔍</div>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">暂无提示词</p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">内容即将上线，敬请期待...</p>
      </div>
    )
  }

  return (
    <div className="grid-uniform">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.slug} prompt={prompt} />
      ))}
    </div>
  )
}
