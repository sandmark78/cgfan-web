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
      const allPrompts = getAllPrompts()
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
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
          美学人格
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          收藏越多，人格越丰富
        </p>
      </div>

      {/* 快速测试入口 */}
      <div className="mb-12">
        <AestheticQuiz />
      </div>

      <TasteCardClient serverFavorites={serverFavorites} isLoggedIn={!!user} />
    </div>
  )
}