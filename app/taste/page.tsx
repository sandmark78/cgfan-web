import { createClient } from '@/lib/supabase/server'
import { getAllPrompts } from '@/lib/prompts'
import { TasteCardClient } from '@/components/taste-card'
import { AestheticQuiz } from '@/components/aesthetic-quiz'

export const runtime = 'edge'

export const metadata = {
  title: '美学人格 | CGfan',
  description: '基于你的收藏，生成专属的美学人格卡片',
}

export default async function TastePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let serverFavorites: { slug: string; title: string; category: string; tags: string[]; model: string; cover: string }[] = []

  if (user) {
    // 登录态：从 Supabase 读取收藏
    const { data: favs } = await supabase
      .from('favorites')
      .select('prompt_slug')
      .eq('user_id', user.id)

    if (favs && favs.length > 0) {
      const allPrompts = await getAllPrompts()
      const slugSet = new Set(favs.map(f => f.prompt_slug))
      serverFavorites = allPrompts
        .filter(p => slugSet.has(p.slug))
        .map(p => ({
          slug: p.slug,
          title: p.title,
          category: p.category,
          tags: p.tags,
          model: p.model,
          cover: p.cover,
        }))
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* 介绍区域 */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4">
          🎨 基于你的收藏偏好
        </div>
        <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white mb-4">
          美学人格
        </h1>
        <p className="mx-auto max-w-lg text-gray-500 dark:text-gray-400 leading-relaxed">
          你的审美，是一种独特的语言。我们通过 8 个美学维度分析你的收藏偏好，
          匹配出最贴合你的美学人格——它会在你收藏的过程中，不断进化和成长。
        </p>
      </div>

      {/* 三步流程说明 */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { step: '01', icon: '🎯', title: '完成测试', desc: '8 道题，60 秒，快速定位你的审美基因' },
          { step: '02', icon: '💛', title: '收藏喜欢的图', desc: '浏览并收藏打动你的提示词，丰富人格画像' },
          { step: '03', icon: '🌱', title: '人格进化成长', desc: '收藏越多，人格越精准，解锁深度人格' },
        ].map((item) => (
          <div key={item.step} className="relative rounded-xl border border-emerald-100 bg-white/60 p-5 text-center backdrop-blur-sm transition-all hover:border-emerald-200 hover:shadow-md dark:border-emerald-900/30 dark:bg-white/5 dark:hover:border-emerald-800/50">
            <div className="mb-2 text-5xl">{item.icon}</div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{item.step}</div>
            <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-gray-200">{item.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <TasteCardClient serverFavorites={serverFavorites} isLoggedIn={!!user} />
    </div>
  )
}