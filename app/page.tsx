import Link from 'next/link'
import { getAllPrompts, getAllCategories } from '@/lib/prompts'
import { PromptGrid } from '@/components/prompt/prompt-grid'
import { getCategoryLabel, getCategoryIcon } from '@/lib/category-map'
import { DailyFeature } from '@/components/daily-feature'

export const runtime = 'edge'

/**
 * 首页 - 绿色 + 奶白 + 毛玻璃风格
 */
export default function Home() {
  const prompts = getAllPrompts()
  const categories = getAllCategories()
  const latestPrompts = prompts.slice(0, 12)

  return (
    <div className="py-3 sm:py-6">
      {/* Hero 区域 */}
      <div className="text-center">
        <h1 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl leading-tight">
          每日一味，一句咒语一张图
        </h1>
        <p className="mx-auto mt-1.5 sm:mt-3 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-400 leading-snug whitespace-pre-line">
          每天精选一个 AI 提示词，附策展笔记和示例图。{'\n'}不贪多，只选好的。复制即用，灵感即走。
        </p>
        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-4">
          <Link href="/explore" className="btn-primary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5">
            开始浏览
          </Link>
          <Link href="/about" className="btn-secondary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5">
            了解更多
          </Link>
        </div>
      </div>

      {/* 每日一味 - 今日推荐 */}
      <DailyFeature />

      {/* 分类 chips */}
      {categories.length > 0 && (
        <div className="mt-4 sm:mt-8">
          <div className="category-chips justify-center overflow-x-auto pb-2 no-scrollbar md:flex-wrap">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/explore?category=${encodeURIComponent(cat.name)}`}
                className="category-chip text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="mr-1 sm:mr-2">{getCategoryIcon(cat.name)}</span>
                {getCategoryLabel(cat.name)}
                <span className="ml-1 sm:ml-2 text-xs opacity-60">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 最新提示词 - 整齐网格 */}
      <div className="mt-4 sm:mt-8 px-4 sm:px-0">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg sm:text-3xl font-bold text-gray-900 dark:text-white">
            最新提示词
          </h2>
          <Link
            href="/explore"
            className="text-xs sm:text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            查看全部 →
          </Link>
        </div>
        <div className="mt-2 sm:mt-4">
          <PromptGrid prompts={latestPrompts} />
        </div>
      </div>
    </div>
  )
}
