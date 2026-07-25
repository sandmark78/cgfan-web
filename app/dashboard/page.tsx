import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllPrompts } from '@/lib/prompts'
import { PromptCard } from '@/components/prompt/prompt-card'
import Link from 'next/link'

export const runtime = 'edge'

export const metadata = {
  title: '我的中心 | CGfan',
  description: '管理你的点赞和收藏',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 获取用户点赞和收藏
  const { data: likes } = await supabase
    .from('likes')
    .select('prompt_slug')
    .eq('user_id', user.id)

  const { data: favorites } = await supabase
    .from('favorites')
    .select('prompt_slug')
    .eq('user_id', user.id)

  const likedSlugs = new Set(likes?.map((l) => l.prompt_slug) || [])
  const favoriteSlugs = new Set(favorites?.map((f) => f.prompt_slug) || [])

  const allPrompts = getAllPrompts()
  const likedPrompts = allPrompts.filter((p) => likedSlugs.has(p.slug))
  const favoritePrompts = allPrompts.filter((p) => favoriteSlugs.has(p.slug))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
          我的中心
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          管理你的点赞和收藏 · 共 {favoritePrompts.length} 个收藏
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 dark:bg-green-500/15">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{favoritePrompts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">已收藏</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 dark:bg-rose-500/15">
              <svg className="h-6 w-6 text-rose-500 dark:text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{likedPrompts.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">已点赞</p>
            </div>
          </div>
        </div>
      </div>

      {/* 去品味档案入口 */}
      <div className="mb-8">
        <Link
          href="/taste"
          className="glass-card group flex items-center justify-between rounded-2xl p-5 transition-all hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 dark:bg-amber-500/15">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">我的美学人格</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">基于收藏生成专属美学人格卡片</p>
            </div>
          </div>
          <svg className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 已收藏 */}
      <section className="mb-12">
        <h2 className="mb-6 font-serif text-xl font-bold text-gray-900 dark:text-white">
          我的收藏
        </h2>
        {favoritePrompts.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mb-4 text-5xl">📦</div>
            <p className="text-gray-500 dark:text-gray-400">还没有收藏任何提示词</p>
            <Link href="/explore" className="btn-primary mt-4 inline-block">
              去发现好提示词 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoritePrompts.map((prompt) => (
              <PromptCard key={prompt.slug} prompt={prompt} />
            ))}
          </div>
        )}
      </section>

      {/* 已点赞 */}
      <section>
        <h2 className="mb-6 font-serif text-xl font-bold text-gray-900 dark:text-white">
          我的点赞
        </h2>
        {likedPrompts.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mb-4 text-5xl">❤️</div>
            <p className="text-gray-500 dark:text-gray-400">还没有点赞任何提示词</p>
            <Link href="/explore" className="btn-primary mt-4 inline-block">
              去发现好提示词 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {likedPrompts.map((prompt) => (
              <PromptCard key={prompt.slug} prompt={prompt} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}