import Link from 'next/link'
import { getAllPrompts, getAllTags } from '@/lib/prompts'
import DailyFeature from '@/components/daily-feature'
import DailyHistory from '@/components/daily-history'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * 首页 - 绿色 + 奶白 + 毛玻璃风格
 */
export default async function Home() {
  const prompts = getAllPrompts()
  
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
      {/* Hero 区域 - 简化版 */}
      <div className="text-center">
        <h1 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl leading-tight">
          每日一味 · 一句提示词，一张图
        </h1>
        <p className="mx-auto mt-1.5 sm:mt-3 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-400 leading-snug">
          每天精选一个 AI 提示词，附示例图和策展笔记。不贪多，只选好的，复制即用。
        </p>
        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link href="/explore" className="btn-primary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5">
            浏览全部
          </Link>
          <Link
            href="/taste"
            className="group relative btn-secondary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5"
          >
            美学人格
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900">
              <div className="font-medium">发现你的美学人格</div>
              <div className="mt-0.5 text-gray-300 dark:text-gray-600">8 道题，60 秒，找到你的审美基因</div>
              {/* 箭头 */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </Link>
        </div>
      </div>

      {/* 每日一味 - 今日推荐 */}
      <div className="mt-8 sm:mt-12">
        <DailyFeature />
      </div>

      {/* 往期精选 - 8个历史卡片 */}
      <DailyHistory />

      {/* 热门标签 - 底部，不滚动 */}
      {popularTags.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            热门标签
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/explore?tag=${encodeURIComponent(tag.name)}`}
                className="category-chip text-xs sm:text-sm"
              >
                <span className="mr-1 sm:mr-2">{tagEmojiMap[tag.name] || '🏷️'}</span>
                {tag.name}
                <span className="ml-1 sm:ml-2 text-xs opacity-60">({tag.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
