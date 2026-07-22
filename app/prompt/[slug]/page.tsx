import { getAllPrompts, getPromptBySlug } from '@/lib/prompts'
import { notFound } from 'next/navigation'
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button'
import { LikeButton } from '@/components/prompt/like-button'
import { FavoriteButton } from '@/components/prompt/favorite-button'
import { PromptGrid } from '@/components/prompt/prompt-grid'
import { DetailImage } from '@/components/prompt/detail-image'
import { createClient } from '@/lib/supabase/server'
import { getCategoryLabel } from '@/lib/category-map'
import Link from 'next/link'

export const runtime = 'edge'

/**
 * 提示词详情页 - 左图右文布局
 */
export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const prompt = getPromptBySlug(slug)

  if (!prompt) {
    notFound()
  }

  /**
   * 格式化提示词文本 - 智能换行
   * 在关键标记符前后添加换行，提升可读性
   */
  function formatPromptText(text: string): string {
    if (!text) return ''
    
    let formatted = text
    
    // 在【】标记前添加换行（中文段落标记）
    formatted = formatted.replace(/(?<!\n)(【)/g, '\n\n$1')
    
    // 在 • 符号前添加换行（列表项）
    formatted = formatted.replace(/(?<!\n)\s*(•\s)/g, '\n  $1')
    
    // 在 Prompt: / Prompt👇 等标记前添加换行
    formatted = formatted.replace(/(?<!\n)\s*(Prompt[：:]?\s*(?:👇[🏻]?)?)/gi, '\n\n$1')
    
    // 在 /imagine 前添加换行
    formatted = formatted.replace(/(?<!\n)\s*(\/imagine)/gi, '\n\n$1')
    
    // 在 👇 前添加换行
    formatted = formatted.replace(/(?<!\n)\s*(👇)/g, '\n$1')
    
    // 清理多余空行（超过2个连续换行变成2个）
    formatted = formatted.replace(/\n{3,}/g, '\n\n')
    
    return formatted.trim()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 获取用户的点赞/收藏状态
  let isLiked = false
  let isFavorited = false

  if (user) {
    const { data: likeData } = await supabase
      .from('likes')
      .select('id')
      .eq('prompt_slug', slug)
      .eq('user_id', user.id)
      .single()

    const { data: favData } = await supabase
      .from('favorites')
      .select('id')
      .eq('prompt_slug', slug)
      .eq('user_id', user.id)
      .single()

    isLiked = !!likeData
    isFavorited = !!favData
  }

  // 获取相似推荐（同分类）
  const allPrompts = getAllPrompts()
  const related = allPrompts
    .filter((p) => p.category === prompt.category && p.slug !== slug)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 面包屑导航 */}
      <nav className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/" className="transition-colors hover:text-green-600 dark:hover:text-green-400">
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/explore?category=${prompt.category}`}
          className="transition-colors hover:text-green-600 dark:hover:text-green-400"
        >
          {getCategoryLabel(prompt.category)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">{prompt.title}</span>
      </nav>

      {/* 两栏布局 */}
      <div className="detail-layout">
        {/* 左侧：示例图 */}
        <div className="relative overflow-hidden rounded-xl" style={{ isolation: 'isolate', transform: 'translateZ(0)', zIndex: 1 }}>
          <DetailImage src={prompt.cover} alt={prompt.title} />
        </div>

        {/* 右侧：提示词信息 */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {prompt.author}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    10pts
                  </div>
                </div>
              </div>
              <button className="btn-primary text-sm">
                关注
              </button>
            </div>
          </div>

          {/* 提示词 */}
          <div className="glass-card p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Prompt:
            </h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
              {formatPromptText(prompt.prompt)}
            </pre>
            <div className="mt-4">
              <CopyPromptButton prompt={prompt.prompt} />
            </div>
          </div>

          {/* 参数 chips */}
          {Object.keys(prompt.parameters).length > 0 && (
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                参数
              </h3>
              <div className="params">
                {Object.entries(prompt.parameters).map(([key, value]) => (
                  <div key={key} className="param-chip">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <LikeButton
                promptSlug={prompt.slug}
                userId={user?.id}
                initialLiked={isLiked}
                isAuthenticated={!!user}
              />
              <FavoriteButton
                promptSlug={prompt.slug}
                userId={user?.id}
                initialFavorited={isFavorited}
                isAuthenticated={!!user}
              />
              <button className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 相似推荐 */}
      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
            相关推荐
          </h2>
          <div className="mt-4">
            <PromptGrid prompts={related} />
          </div>
        </div>
      )}
    </div>
  )
}
