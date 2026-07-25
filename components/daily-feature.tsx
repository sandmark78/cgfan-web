import Link from 'next/link'
import Image from 'next/image'
import { getTodayFeature, getYesterdayFeature, getTomorrowFeature } from '@/lib/daily-feature'
import { getPromptBySlug } from '@/lib/prompts'
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button'
import { MobileCollapse } from '@/components/mobile-collapse'

export const runtime = 'edge'

/**
 * 每日一味 - 今日推荐
 * 图左文右横向紧凑卡，火漆印章左上角标，日期签右下对角
 */
export default function DailyFeature() {
  const todayFeature = getTodayFeature()
  const yesterdayFeature = getYesterdayFeature()
  const tomorrowFeature = getTomorrowFeature()

  if (!todayFeature) return null

  const prompt = getPromptBySlug(todayFeature.slug)
  if (!prompt) return null

  const today = new Date()
  const day = today.getDate()
  const month = today.getMonth() + 1
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[today.getDay()]
  // 中文月份
  const cnNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
  const cnMonth = cnNums[month]

  // 序号
  const serial = String((day * 137 + month * 911) % 9000 + 1000)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return (
    <section className="daily-pick">
      {/* 印章放在卡片外面，避免被裁切 */}
      <img
        src="/seal-daily.png"
        alt="每日一味"
        className="daily-seal"
        draggable={false}
      />
      
      <article className="daily-card glass-card">
        {/* 左：图 + 角标 */}
        <figure className="daily-figure">
          {prompt.cover ? (
            <Image
              src={prompt.cover}
              alt={prompt.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200 text-6xl dark:bg-gray-800">
              🎨
            </div>
          )}

          {/* 日期签 —— 右下角 */}
          <figcaption className="daily-date">
            <span className="daily-date-day">{day}</span>
            <span className="daily-date-meta">{cnMonth}月 · 周{weekday}</span>
          </figcaption>
        </figure>

        {/* 右：文字，紧凑 */}
        <div className="daily-body">
          <span className="daily-kicker">今日精选 · No.{serial}</span>
          <h2 className="daily-title">{prompt.title}</h2>

          {todayFeature.technique && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {todayFeature.technique.split(' · ').map((t: string) => (
                <span key={t} className="daily-tag">{t}</span>
              ))}
            </div>
          )}

          {/* 移动端：策展笔记全部折叠 */}
          <MobileCollapse>
            <p className="daily-note">{todayFeature.curatorNote}</p>

            {todayFeature.tip && (
              <div className="mb-3 rounded-lg border border-green-200/40 bg-green-50/40 px-3 py-2 dark:border-green-800/30 dark:bg-green-900/20">
                <div className="mb-0.5 text-[10px] font-medium tracking-wider text-green-600 dark:text-green-400">💡 实用技巧</div>
                <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">{todayFeature.tip}</p>
              </div>
            )}

            {todayFeature.tryChange && (
              <div className="mb-3 border-l-2 border-amber-400/50 pl-3">
                <div className="text-[10px] font-medium tracking-wider text-amber-600 dark:text-amber-400">✏️ 试着改一个词</div>
                <p className="text-[12px] italic leading-relaxed text-gray-600 dark:text-gray-400">{todayFeature.tryChange}</p>
              </div>
            )}
          </MobileCollapse>

          {/* 桌面端：策展笔记正常显示 */}
          <div className="hidden md:block">
            <p className="daily-note">{todayFeature.curatorNote}</p>

            {todayFeature.tip && (
              <div className="mb-3 rounded-lg border border-green-200/40 bg-green-50/40 px-3 py-2 dark:border-green-800/30 dark:bg-green-900/20">
                <div className="mb-0.5 text-[10px] font-medium tracking-wider text-green-600 dark:text-green-400">💡 实用技巧</div>
                <p className="text-[12px] leading-relaxed text-gray-700 dark:text-gray-300">{todayFeature.tip}</p>
              </div>
            )}

            {todayFeature.tryChange && (
              <div className="mb-3 border-l-2 border-amber-400/50 pl-3">
                <div className="text-[10px] font-medium tracking-wider text-amber-600 dark:text-amber-400">✏️ 试着改一个词</div>
                <p className="text-[12px] italic leading-relaxed text-gray-600 dark:text-gray-400">{todayFeature.tryChange}</p>
              </div>
            )}
          </div>

          <div className="daily-actions">
            <Link href={`/prompt/${prompt.slug}`} className="daily-more">
              看完整策展
            </Link>
            <CopyPromptButton prompt={prompt.prompt} label="复制提示词" />
          </div>
        </div>
      </article>

      {/* 底部导航 */}
      <div className="daily-nav">
        {yesterdayFeature ? (
          <Link
            href={`/prompt/${yesterdayFeature.slug}`}
            className="daily-nav-link daily-nav-prev"
          >
            <svg className="daily-nav-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="daily-nav-label">昨天</span>
            <span className="daily-nav-title">{getPromptBySlug(yesterdayFeature.slug)?.title || '未知'}</span>
          </Link>
        ) : <div />}

        {tomorrowFeature ? (
          <Link
            href={`/prompt/${tomorrowFeature.slug}`}
            className="daily-nav-link daily-nav-next"
          >
            <span className="daily-nav-label">明天</span>
            <span className="daily-nav-title">{getPromptBySlug(tomorrowFeature.slug)?.title || '未知'}</span>
            <svg className="daily-nav-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div className="text-sm text-gray-400 dark:text-gray-600">明天：？</div>
        )}
      </div>
    </section>
  )
}