import { getAllPrompts, getPromptBySlug } from '@/lib/prompts'
import { notFound } from 'next/navigation'
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button'
import { LikeButton } from '@/components/prompt/like-button'
import { FavoriteButton } from '@/components/prompt/favorite-button'
import { ShareButton } from '@/components/prompt/share-button'
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
  let likeCount = 0

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

  // 获取总点赞数（所有用户）
  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_slug', slug)

  likeCount = count || 0

  // 获取相似推荐（同分类）
  const allPrompts = getAllPrompts()
  const related = allPrompts
    .filter((p) => p.category === prompt.category && p.slug !== slug)
    .slice(0, 6)

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
      </nav>

      {/* 主标题 */}
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        {prompt.title.length > 60 ? prompt.title.slice(0, 60) + '...' : prompt.title}
      </h1>

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
                  <div className="text-xs text-gray-400 dark:text-gray-500">作者</div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {prompt.author}
                  </div>
                </div>
              </div>
              {prompt.source && (() => {
                const match = prompt.source.match(/x\.com\/([^/]+)\/status/);
                const username = match && match[1] !== 'i' ? match[1] : null;
                const linkUrl = username ? `https://x.com/${username}` : prompt.source;
                const linkLabel = username ? '查看主页' : '查看原文';
                return (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-[10px] inline-flex items-center gap-1"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    {linkLabel}
                  </a>
                );
              })()}
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
                initialCount={likeCount}
                isAuthenticated={!!user}
              />
              <FavoriteButton
                promptSlug={prompt.slug}
                userId={user?.id}
                initialFavorited={isFavorited}
                isAuthenticated={!!user}
              />
              <ShareButton promptSlug={prompt.slug} promptTitle={prompt.title} />
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
            <PromptGrid prompts={related} maxRows={2} />
          </div>
        </div>
      )}
    </div>
  )
}
