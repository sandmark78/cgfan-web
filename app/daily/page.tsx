import Link from 'next/link'
import Image from 'next/image'
import { getAllFeatures } from '@/lib/daily-feature'
import { getPromptBySlug } from '@/lib/prompts'

export const runtime = 'edge'

export const metadata = {
  title: '每日一味 | CGfan',
  description: '每日一味精选，附策展笔记与实用技巧',
}

export default function DailyPage() {
  const features = getAllFeatures()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
          每日一味
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          每天一个精选推荐，附策展笔记与实用技巧
        </p>
      </div>

      <div className="space-y-8">
        {features.map((feature) => {
          const prompt = getPromptBySlug(feature.slug)
          if (!prompt) return null

          const date = new Date(feature.date)
          const month = date.getMonth() + 1
          const day = date.getDate()

          return (
            <article key={feature.date} className="glass-card overflow-hidden">
              <div className="grid md:grid-cols-[280px_1fr]">
                {/* 左：图片 */}
                <Link href={`/prompt/${prompt.slug}`} className="relative aspect-[4/5] overflow-hidden md:aspect-auto">
                  {prompt.cover ? (
                    <Image
                      src={prompt.cover}
                      alt={prompt.title}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-5xl dark:bg-gray-800">🎨</div>
                  )}
                  {/* 日期胶囊 */}
                  <div className="absolute bottom-3 right-3 z-10 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm dark:bg-gray-900/60 dark:text-gray-300">
                    {month}月{day}日
                  </div>
                </Link>

                {/* 右：内容 */}
                <div className="flex flex-col justify-center p-6 md:p-8">
                  <span className="mb-2 text-[10px] font-medium tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    每日精选 · {feature.date}
                  </span>
                  <h2 className="mb-2 font-serif text-2xl font-bold text-gray-900 dark:text-white">
                    <Link href={`/prompt/${prompt.slug}`} className="hover:underline">
                      {prompt.title}
                    </Link>
                  </h2>

                  {feature.technique && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {feature.technique.split(' · ').map((t: string) => (
                        <span key={t} className="daily-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  <p className="mb-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {feature.curatorNote}
                  </p>

                  {feature.tip && (
                    <div className="mb-3 rounded-lg border border-green-200/40 bg-green-50/40 px-3 py-2 dark:border-green-800/30 dark:bg-green-900/20">
                      <div className="mb-0.5 text-[10px] font-medium tracking-wider text-green-600 dark:text-green-400">💡 实用技巧</div>
                      <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">{feature.tip}</p>
                    </div>
                  )}

                  {feature.tryChange && (
                    <div className="mb-3 border-l-2 border-amber-400/50 pl-3">
                      <div className="text-[10px] font-medium tracking-wider text-amber-600 dark:text-amber-400">✏️ 试着改一个词</div>
                      <p className="text-[12px] italic leading-relaxed text-gray-600 dark:text-gray-400">{feature.tryChange}</p>
                    </div>
                  )}

                  <Link
                    href={`/prompt/${prompt.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    看完整策展 →
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}