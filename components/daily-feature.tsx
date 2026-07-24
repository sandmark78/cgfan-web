import Link from 'next/link'
import { getTodayFeature, getYesterdayFeature, getTomorrowFeature } from '@/lib/daily-feature'
import { getPromptBySlug } from '@/lib/prompts'
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button'

/**
 * 每日一味 - 首页今日推荐区块
 */
export async function DailyFeature() {
  const todayFeature = getTodayFeature()
  const yesterdayFeature = getYesterdayFeature()
  const tomorrowFeature = getTomorrowFeature()

  if (!todayFeature) {
    return null
  }

  const prompt = getPromptBySlug(todayFeature.slug)
  if (!prompt) {
    return null
  }

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[date.getDay()]
    return `${month}月${day}日 · 周${weekday}`
  }

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
        {/* 日期标签 */}
        <div className="absolute left-6 top-6 z-10">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {formatDate(today)}
          </div>
        </div>

        {/* 主内容 */}
        <div className="grid gap-0 md:grid-cols-2">
          {/* 左侧：图片 */}
          <div className="relative aspect-square overflow-hidden md:aspect-auto md:min-h-[400px]">
            {prompt.cover ? (
              <img
                src={prompt.cover}
                alt={prompt.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-200 text-6xl dark:bg-gray-800">
                🎨
              </div>
            )}
          </div>

          {/* 右侧：内容 */}
          <div className="flex flex-col justify-center p-8 md:p-12">
            {/* 标题 */}
            <h2 className="mb-4 font-serif text-3xl font-bold text-gray-900 dark:text-white">
              {prompt.title}
            </h2>

            {/* 亮点 */}
            {todayFeature.highlight && (
              <div className="mb-6 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {todayFeature.highlight}
              </div>
            )}

            {/* 策展笔记 */}
            <div className="mb-8">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                策展笔记
              </div>
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {todayFeature.curatorNote}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3">
              <CopyPromptButton prompt={prompt.prompt} />
              <Link
                href={`/prompt/${prompt.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              >
                查看完整迭代过程
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          {yesterdayFeature ? (
            <Link
              href={`/prompt/${yesterdayFeature.slug}`}
              className="group flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              昨天：{getPromptBySlug(yesterdayFeature.slug)?.title || '未知'}
            </Link>
          ) : (
            <div />
          )}

          {tomorrowFeature ? (
            <Link
              href={`/prompt/${tomorrowFeature.slug}`}
              className="group flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              明天：{getPromptBySlug(tomorrowFeature.slug)?.title || '未知'}
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-600">
              明天：？
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
