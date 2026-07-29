import Link from 'next/link'
import { getAllPrompts, getAllCategories, getAllTags } from '@/lib/prompts'
import { PromptGrid } from '@/components/prompt/prompt-grid'
import { getCategoryLabel, getCategoryIcon } from '@/lib/category-map'
import DailyFeature from '@/components/daily-feature'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * 首页 - 绿色 + 奶白 + 毛玻璃风格
 */
export default async function Home() {
  const prompts = getAllPrompts()
  const categories = getAllCategories()
  
  // 从 Supabase 获取所有提示词的点赞数
  const supabase = await createClient()
  const { data: likes } = await supabase
    .from('likes')
    .select('prompt_slug')
  
  // 统计每个提示词的点赞数
  const likeCounts: Record<string, number> = {}
  if (likes) {
    likes.forEach((like) => {
      likeCounts[like.prompt_slug] = (likeCounts[like.prompt_slug] || 0) + 1
    })
  }
  
  // 给每个提示词添加点赞数
  const promptsWithLikes = prompts.map((p) => ({
    ...p,
    likeCount: likeCounts[p.slug] || 0,
  }))
  
  // 数据已更新，首页需要显示最新上传的12条，所以从末尾取
  const latestPrompts = [...promptsWithLikes].sort((a, b) => {
    const addedA = a.added || ''
    const addedB = b.added || ''
    // 倒序：最新在前
    if (addedA && addedB) return addedB.localeCompare(addedA)
    return 0
  }).slice(0, 12)
  
  // 获取热门标签（前20个，排除 AI绘图 和 提示词）
  const popularTags = getAllTags()
    .filter(tag => tag.name !== 'AI绘图' && tag.name !== '提示词')
    .slice(0, 20)
  
  // 标签 emoji 映射
  const tagEmojiMap: Record<string, string> = {
    '写实': '📷',
    '摄影': '📸',
    '3D渲染': '🎮',
    '人物': '👤',
    '产品': '📦',
    '风景': '🏔️',
    '电影感': '🎬',
    '极简': '✨',
    'AI艺术': '🤖',
    '动漫': '🎨',
    '复古': '📼',
    '超现实': '🌀',
    '建筑': '🏛️',
    '科幻': '🚀',
    '抽象': '🎭',
    '可爱': '🐻',
    '奇幻': '🧙',
    '概念艺术': '💡',
    'AI绘图': '🎯',
    '提示词': '💬',
  }

  return (
    <div className="py-3 sm:py-6">
      {/* Hero 区域 */}
      <div className="text-center">
        <h1 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl leading-tight">
                  每日一味 · 一句提示词，一张图
                </h1>
                <p className="mx-auto mt-1.5 sm:mt-3 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-400 leading-snug">
                  每天精选一个 AI 提示词，附示例图和策展笔记。不贪多，只选好的，复制即用。
                </p>
        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link href="/explore" className="btn-primary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5">
            开始浏览
          </Link>
          <Link href="/about" className="btn-secondary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5">
            了解更多
          </Link>
          <Link
            href="/taste"
            className="group relative inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-500 hover:shadow-md dark:bg-green-700 dark:hover:bg-green-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            美学人格
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900">
              <div className="font-medium">发现你的美学人格</div>
              <div className="mt-0.5 text-gray-300 dark:text-gray-600">3 道题，30 秒，找到你的审美基因</div>
              {/* 箭头 */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </Link>
        </div>
      </div>

      {/* 每日一味 - 今日推荐 */}
      <DailyFeature />

      {/* 热门标签 */}
      {popularTags.length > 0 && (
        <div className="mt-2 sm:mt-4">
          <div className="category-chips justify-center overflow-x-auto pb-2 no-scrollbar md:flex-wrap">
            {popularTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/explore?tag=${encodeURIComponent(tag.name)}`}
                className="category-chip text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="mr-1 sm:mr-2">{tagEmojiMap[tag.name] || '🏷️'}</span>
                {tag.name}
                <span className="ml-1 sm:ml-2 text-xs opacity-60">({tag.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 最新提示词 */}
      <div className="mt-3 sm:mt-6 px-4 sm:px-0">
        <PromptGrid prompts={latestPrompts} />
      </div>

      {/* WebSite JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'CGfan',
            url: 'https://www.cgfan.com',
            description: '每日一味 · 一句提示词，一张图。精选 AI 提示词与示例图鉴，附策展笔记，复制即用。',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://www.cgfan.com/explore?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </div>
  )
}
