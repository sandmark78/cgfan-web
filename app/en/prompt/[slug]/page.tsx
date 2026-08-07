import { getPromptBySlug } from '@/lib/prompts'
import { notFound } from 'next/navigation'
import { CopyPromptButton } from '@/components/prompt/copy-prompt-button'
import { LikeButton } from '@/components/prompt/like-button'
import { FavoriteButton } from '@/components/prompt/favorite-button'
import { ShareButton } from '@/components/prompt/share-button'
import { DetailImage } from '@/components/prompt/detail-image'
import { PromptTextBlock } from '@/components/prompt/prompt-text-block'
import { PromptRecipeCard } from '@/components/prompt-recipe-card'
import { PromptDNA } from '@/components/prompt/prompt-dna'
import { createClient } from '@/lib/supabase/server'
import { getCategoryLabel } from '@/lib/category-map'
import Link from 'next/link'
import type { Metadata } from 'next'

export const runtime = 'edge'

/**
 * Generate SEO metadata for detail page
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
      title: 'Prompt Not Found',
    }
  }

  const baseUrl = 'https://www.cgfan.com'
  const description = prompt.prompt.slice(0, 160).replace(/\n/g, ' ')

  return {
    title: prompt.title,
    description,
    alternates: {
      canonical: `${baseUrl}/en/prompt/${slug}`,
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
 * Prompt detail page - simplified version without related prompts
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
   * Format prompt text - smart line breaks
   */
  function formatPromptText(text: string): string {
    if (!text) return ''
    
    let formatted = text
    
    // Add line break before 【】 markers
    formatted = formatted.replace(/(?<!\n)(【)/g, '\n\n$1')
    
    // Add line break before • symbols
    formatted = formatted.replace(/(?<!\n)\s*(•\s)/g, '\n  $1')
    
    // Add line break before Prompt: / Prompt👇 markers
    formatted = formatted.replace(/(?<!\n)\s*(Prompt[：:]?\s*(?:👇[🏻]?)?)/gi, '\n\n$1')
    
    // Add line break before /imagine
    formatted = formatted.replace(/(?<!\n)\s*(\/imagine)/gi, '\n\n$1')
    
    // Add line break before 👇
    formatted = formatted.replace(/(?<!\n)\s*(👇)/g, '\n$1')
    
    // Clean up extra blank lines
    formatted = formatted.replace(/\n{3,}/g, '\n\n')
    
    return formatted.trim()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's like/favorite status
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

  // Get total like count
  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_slug', slug)

  likeCount = count || 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/en" className="transition-colors hover:text-green-600 dark:hover:text-green-400">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/en/explore?category=${prompt.category}`}
          className="transition-colors hover:text-green-600 dark:hover:text-green-400"
        >
          {getCategoryLabel(prompt.category)}
        </Link>
      </nav>

      {/* Main title */}
      <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
        {prompt.title.length > 60 ? prompt.title.slice(0, 60) + '...' : prompt.title}
      </h1>

      {/* Two-column layout */}
      <div className="detail-layout">
        {/* Left: Image */}
        <div className="relative overflow-hidden rounded-xl min-w-0">
          <DetailImage src={prompt.cover} alt={prompt.title} images={prompt.images} />
        </div>

        {/* Right: Prompt info */}
        <div className="space-y-6 min-w-0">
          {/* Source attribution */}
          <div className="rounded-xl p-4 bg-white/50 dark:bg-zinc-800/50 border border-dashed border-gray-300 dark:border-zinc-600">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Prompt from</span>
                {prompt.sourceLink && (() => {
                  if (prompt.authorLink) {
                    return (
                      <a
                        href={prompt.authorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 dark:text-green-400 hover:underline"
                      >
                        {prompt.author}
                      </a>
                    )
                  }
                  const xMatch = prompt.sourceLink.match(/x\.com\/([^/]+)\/status/)
                  const username = xMatch ? xMatch[1] : null
                  if (username && username !== 'i') {
                    return (
                      <a
                        href={`https://x.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 dark:text-green-400 hover:underline"
                      >
                        @{username}
                      </a>
                    )
                  }
                  if (prompt.sourceLink) {
                    return (
                      <a
                        href={prompt.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 dark:text-green-400 hover:underline"
                      >
                        {prompt.author}
                      </a>
                    )
                  }
                  return (
                    <span className="font-medium text-gray-900 dark:text-white">{prompt.author}</span>
                  )
                })()}
              </div>
              {prompt.sourceLink && (
                <a
                  href={prompt.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:underline"
                >
                  View Original
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Category and tags */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Category:</span>
              <Link
                href={`/en/explore?category=${prompt.category}`}
                className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                {getCategoryLabel(prompt.category)}
              </Link>
            </div>
            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tags:</span>
                {prompt.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/en/explore?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Prompt */}
          <div className="glass-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Prompt:
              </h3>
              <CopyPromptButton
                prompt={prompt.prompt}
                label="Copy"
                className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/30 dark:bg-green-700 dark:hover:bg-green-600 dark:shadow-green-700/30"
              />
            </div>
            <PromptTextBlock text={formatPromptText(prompt.prompt)} maxLines={20} showCopyButton={false} />
          </div>

          {/* Prompt DNA */}
          {prompt.promptDNA && (
            <PromptDNA
              dna={prompt.promptDNA.dna}
              metrics={prompt.promptDNA.metrics}
              recommendedModels={prompt.promptDNA.recommended_models}
            />
          )}

          {/* Action buttons */}
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
                prompt={{
                  slug: prompt.slug,
                  title: prompt.title,
                  category: prompt.category,
                  tags: prompt.tags,
                  model: prompt.model,
                  cover: prompt.cover,
                }}
                userId={user?.id}
                initialFavorited={isFavorited}
                isAuthenticated={!!user}
              />
              <ShareButton
                promptSlug={prompt.slug}
                promptTitle={prompt.title}
                promptDescription={prompt.prompt}
                className="ml-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Prompt share card */}
      <div className="mt-12" data-share-card>
        <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
          Generate Share Card
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Download beautiful prompt cards to share on social media
        </p>
        <div className="mt-6">
          <PromptRecipeCard prompt={prompt} />
        </div>
      </div>

      {/* JSON-LD structured data */}
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
              url: 'https://www.cgfan.com',
            },
          }),
        }}
      />
    </div>
  )
}
