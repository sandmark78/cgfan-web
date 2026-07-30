import Link from 'next/link'
import Image from 'next/image'
import { getAllFeatures } from '@/lib/daily-feature'
import { getPromptBySlug } from '@/lib/prompts'

export const runtime = 'edge'

/**
 * 每日一味历史卡片 - 显示过去8天的精选
 */
export default function DailyHistory() {
  const allFeatures = getAllFeatures().slice(1, 9) // 跳过今天，取过去8天

  if (allFeatures.length === 0) return null

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
          往期精选
        </h2>
        <Link href="/daily" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {allFeatures.map((feature) => {
          const prompt = getPromptBySlug(feature.slug)
          if (!prompt) return null

          const date = new Date(feature.date)
          const day = date.getDate()
          const month = date.getMonth() + 1
          const cnNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
          const cnMonth = cnNums[month]

          return (
            <Link
              key={feature.slug}
              href={`/prompt/${prompt.slug}`}
              className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg dark:bg-gray-800/60"
            >
              {/* 图片 */}
              <div className="relative aspect-square overflow-hidden">
                {prompt.cover ? (
                  <Image
                    src={prompt.cover}
                    alt={prompt.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-200 text-4xl dark:bg-gray-800">
                    🎨
                  </div>
                )}

                {/* 日期标签 */}
                <div className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-center backdrop-blur-sm dark:bg-gray-900/90">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{day}</div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">{cnMonth}月</div>
                </div>
              </div>

              {/* 内容 */}
              <div className="p-4">
                <h3 className="mb-2 line-clamp-2 font-serif text-sm font-bold text-gray-900 group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400">
                  {prompt.title}
                </h3>
                {feature.technique && (
                  <div className="flex flex-wrap gap-1">
                    {feature.technique.split(' · ').slice(0, 2).map((t: string) => (
                      <span key={t} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
