import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllPrompts } from '@/lib/prompts'
import { PromptCard } from '@/components/prompt/prompt-card'

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">我的中心</h1>
        <p className="mt-2 text-zinc-400">管理你的点赞和收藏</p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-6 w-6 text-red-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{likedPrompts.length}</p>
              <p className="text-sm text-zinc-400">已点赞</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{favoritePrompts.length}</p>
              <p className="text-sm text-zinc-400">已收藏</p>
            </div>
          </div>
        </div>
      </div>

      {/* 已收藏 */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">我的收藏</h2>
        {favoritePrompts.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">还没有收藏任何提示词</p>
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
        <h2 className="mb-4 text-xl font-semibold">我的点赞</h2>
        {likedPrompts.length === 0 ? (
          <div className="rounded-2xl bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-500">还没有点赞任何提示词</p>
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
