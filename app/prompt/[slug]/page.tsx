import { getAllPrompts, getPromptBySlug } from '@/lib/prompts'
import { notFound } from 'next/navigation'
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button'
import { LikeButton } from '@/components/prompt/like-button'
import { FavoriteButton } from '@/components/prompt/favorite-button'
import { ShareButton } from '@/components/prompt/share-button'
import { PromptGrid } from '@/components/prompt/prompt-grid'
import { DetailImage } from '@/components/prompt/detail-image'
import { PromptTextBlock } from '@/components/prompt/prompt-text-block'
import { PromptRecipeCard } from '@/components/prompt-recipe-card'
import { createClient } from '@/lib/supabase/server'
import { getCategoryLabel } from '@/lib/category-map'
import Link from 'next/link'
import type { Metadata } from 'next'

export const runtime = 'edge'

/**
 * 生成详情页 SEO 元数据
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const prompt = getPromptBySlug(slug)

  if (!prompt) {
    return {
      title: '提示词未找到',
    }
  }

  const baseUrl = 'https://cgfan-web.pages.dev'
  const description = prompt.prompt.slice(0, 160).replace(/\n/g, ' ')

  return {
    title: `${prompt.title} | CGfan`,
    description,
    alternates: {
      canonical: `${baseUrl}/prompt/${slug}`,
    },
    openGraph: {
      title: prompt.title,
      description,
      images: [
        {
          url: prompt.cover,
          width: 1200,
          height: 900,
          alt: prompt.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: prompt.title,
      description,
      images: [prompt.cover],
    },
  }
}

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

  // 上一篇/下一篇导航
  const currentIndex = allPrompts.findIndex((p) => p.slug === slug)
  const prevPrompt = currentIndex > 0 ? allPrompts[currentIndex - 1] : null
  const nextPrompt = currentIndex < allPrompts.length - 1 ? allPrompts[currentIndex + 1] : null

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
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
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
                    className="inline-flex items-center gap-1 text-[10px]! font-semibold text-white bg-[var(--green-500)] hover:bg-[var(--green-600)] rounded-full px-3 py-1.5 transition-all hover:-translate-y-0.5"
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

          {/* 分类和标签 */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">分类：</span>
              <Link
                href={`/explore?category=${prompt.category}`}
                className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                {getCategoryLabel(prompt.category)}
              </Link>
            </div>
            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">标签：</span>
                {prompt.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 提示词 */}
          <div className="glass-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Prompt:
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>{prompt.prompt.length.toLocaleString()} 字符</span>
                <span>约 {Math.ceil(prompt.prompt.length / 500)} 分钟阅读</span>
              </div>
            </div>
            <PromptTextBlock text={formatPromptText(prompt.prompt)} maxLines={20} />
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

      {/* 上一篇/下一篇导航 */}
      {(prevPrompt || nextPrompt) && (
        <div className="mt-12 flex items-center justify-between gap-4">
          {prevPrompt ? (
            <Link
              href={`/prompt/${prevPrompt.slug}`}
              className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-green-500 hover:shadow-md dark:border-gray-700 dark:hover:border-green-500"
            >
              <svg className="h-5 w-5 text-gray-400 transition-transform group-hover:-translate-x-1 group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">上一篇</div>
                <div className="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{prevPrompt.title}</div>
              </div>
            </Link>
          ) : <div />}
          {nextPrompt ? (
            <Link
              href={`/prompt/${nextPrompt.slug}`}
              className="group flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-right transition-all hover:border-green-500 hover:shadow-md dark:border-gray-700 dark:hover:border-green-500"
            >
              <div className="flex-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">下一篇</div>
                <div className="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{nextPrompt.title}</div>
              </div>
              <svg className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : <div />}
        </div>
      )}

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

      {/* Prompt 食谱卡 */}
      <div className="mt-12">
        <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
          生成分享卡片
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          下载精美的 Prompt 食谱卡，分享到社交媒体
        </p>
        <div className="mt-6">
          <PromptRecipeCard prompt={prompt} />
        </div>
      </div>

      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: prompt.title,
            description: prompt.prompt.slice(0, 200),
            image: prompt.cover,
            author: {
              '@type': 'Person',
              name: prompt.author,
            },
            datePublished: prompt.date,
            keywords: prompt.tags.join(', '),
            publisher: {
              '@type': 'Organization',
              name: 'CGfan',
              url: 'https://cgfan-web.pages.dev',
            },
          }),
        }}
      />
    </div>
  )
}
