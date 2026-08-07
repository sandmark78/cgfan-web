import Link from 'next/link'
import { getAllPrompts, getAllTags } from '@/lib/prompts'
import DailyFeature from '@/components/daily-feature'
import DailyHistory from '@/components/daily-history'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * English Home Page
 */
export default async function Home() {
  const prompts = await getAllPrompts()
  
  // Get likes from Supabase
  const supabase = await createClient()
  const { data: likes } = await supabase
    .from('likes')
    .select('prompt_slug')
  
  // Count likes per prompt
  const likeCounts: Record<string, number> = {}
  if (likes) {
    likes.forEach((like) => {
      likeCounts[like.prompt_slug] = (likeCounts[like.prompt_slug] || 0) + 1
    })
  }
  
  // Add like counts to prompts
  const promptsWithLikes = prompts.map((p) => ({
    ...p,
    likeCount: likeCounts[p.slug] || 0,
  }))
  
  // Get popular tags (top 20, excluding AI绘图 and 提示词)
  const popularTags = (await getAllTags())
    .filter(tag => tag.name !== 'AI绘图' && tag.name !== '提示词')
    .slice(0, 20)
  
  // Tag emoji mapping
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
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl leading-tight">
          Daily Pick · One Prompt, One Image
        </h1>
        <p className="mx-auto mt-1.5 sm:mt-3 max-w-2xl text-sm sm:text-lg text-gray-600 dark:text-gray-400 leading-snug">
          Curated AI prompts with examples and notes. Quality over quantity, ready to use.
        </p>
        <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link href="/en/explore" className="btn-primary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5">
            Browse All
          </Link>
          <Link
            href="/en/taste"
            className="group relative btn-secondary text-sm sm:text-base px-5 sm:px-7 py-2 sm:py-2.5"
          >
            Aesthetic Persona
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-100 dark:text-gray-900">
              <div className="font-medium">Discover your aesthetic persona</div>
              <div className="mt-0.5 text-gray-300 dark:text-gray-600">8 questions, 60 seconds, find your aesthetic DNA</div>
              {/* Arrow */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-100" />
            </div>
          </Link>
        </div>
      </div>

      {/* Daily Feature */}
      <div className="mt-8 sm:mt-12">
        <DailyFeature />
      </div>

      {/* Past Selections */}
      <DailyHistory />

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            Popular Tags
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/en/explore?tag=${encodeURIComponent(tag.name)}`}
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

      {/* WebSite JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'CGfan',
            url: 'https://www.cgfan.com',
            description: 'Daily Pick · One Prompt, One Image. Curated AI prompts with examples and notes, ready to use.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://www.cgfan.com/en/explore?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </div>
  )
}
