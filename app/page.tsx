import Link from 'next/link'
import { getAllPrompts, getAllCategories } from '@/lib/prompts'
import { PromptGrid } from '@/components/prompt/prompt-grid'

/**
 * 首页 - 绿色 + 奶白 + 毛玻璃风格
 */
export default function Home() {
  const prompts = getAllPrompts()
  const categories = getAllCategories()
  const latestPrompts = prompts.slice(0, 8)

  // 分类图标映射
  const categoryIcons: Record<string, string> = {
    cyberpunk: '🌃',
    anime: '🎨',
    '3d': '🎮',
    realistic: '📷',
    landscape: '🏔️',
    portrait: '👤',
    architecture: '🏛️',
    abstract: '🎭',
  }

  const categoryNames: Record<string, string> = {
    cyberpunk: '赛博朋克',
    anime: '动漫风格',
    '3d': '3D 渲染',
    realistic: '写实风格',
    landscape: '风景',
    portrait: '人物',
    architecture: '建筑',
    abstract: '抽象',
  }

  return (
    <div className="py-3 sm:py-6">
      {/* Hero 区域 */}
      <div className="text-center">
        <h1 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl leading-tight">
          分享 AI 提示词和示例图
        </h1>
        <p className="mx-auto mt-1.5 sm:mt-3 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-400 leading-snug">
          每日精选 AI 提示词和示例图，分门别类，方便查找和复用
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

      {/* 分类 chips */}
      {categories.length > 0 && (
        <div className="mt-4 sm:mt-8">
          <div className="category-chips justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/explore?category=${encodeURIComponent(cat.name)}`}
                className="category-chip text-xs sm:text-sm"
              >
                <span className="mr-1 sm:mr-2">{categoryIcons[cat.name] || '📁'}</span>
                {categoryNames[cat.name] || cat.name}
                <span className="ml-1 sm:ml-2 text-xs opacity-60">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 最新提示词 - 整齐网格 */}
      <div className="mt-4 sm:mt-8">
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
