import { getAllPrompts, getAllCategories, getAllTags, getPromptsByCategory, getPromptsByTag } from '@/lib/prompts'
import { InfiniteGrid } from '@/components/infinite-grid'
import { PromptGrid } from '@/components/prompt/prompt-grid'
import { getCategoryLabel } from '@/lib/category-map'
import Link from 'next/link'
import type { Metadata } from 'next'
import Pagination from '@/components/pagination'

export const runtime = 'edge'

/**
 * 生成探索页 SEO 元数据
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; page?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const { category, tag, q, page } = params
  const currentPage = Math.max(1, parseInt(page || '1', 10))
  const baseUrl = 'https://www.cgfan.com'

  let title = '探索'
  let description = '浏览精选 AI 提示词，涵盖写实、动漫、3D、摄影等风格，支持 GPT-Image、Midjourney 等模型，一键复制即用。'

  if (category) {
    title = `${getCategoryLabel(category)}`
    description = `浏览 ${getCategoryLabel(category)} 风格的 AI 提示词，共多款精选 prompt，附示例图和策展笔记。`
  }
  if (tag) {
    title = `#${tag}`
    description = `浏览 #${tag} 标签的 AI 提示词合集，附示例图和策展笔记。`
  }
  if (q) {
    title = `搜索: ${q}`
    description = `搜索 "${q}" 相关的 AI 提示词结果。`
  }
  if (currentPage > 1) {
    title += ` 第${currentPage}页`
    description += ` 第 ${currentPage} 页，共多页内容。`
  }

  let canonical = `${baseUrl}/explore`
  const paramsStr = new URLSearchParams()
  if (category) paramsStr.set('category', category)
  if (tag) paramsStr.set('tag', tag)
  if (q) paramsStr.set('q', q)
  if (currentPage > 1) paramsStr.set('page', String(currentPage))
  const query = paramsStr.toString()
  if (query) canonical += `?${query}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | CGfan`,
      description,
    },
  }
}

/**
 * 浏览页 - 分类/标签/搜索（无限滚动）
 */
const PAGE_SIZE = 20

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string }>
}) {
  const params = await searchParams
  const { category, tag, q } = params

  const categories = getAllCategories()
  const tags = getAllTags()

  // 根据筛选条件获取提示词
  let prompts = getAllPrompts()
  // 数据已按上传时间升序排列，探索页需要显示最新优先（倒序）
  prompts = [...prompts].reverse()
  let activeFilter = ''

  if (q) {
    // 搜索：匹配标题、提示词内容、标签、作者
    const query = q.toLowerCase()
    prompts = prompts.filter((p) =>
      p.title.toLowerCase().includes(query) ||
      p.prompt.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query)) ||
      p.author.toLowerCase().includes(query) ||
      p.model.toLowerCase().includes(query)
    )
    activeFilter = `"${q}"`
  } else if (category) {
    prompts = getPromptsByCategory(category)
    activeFilter = getCategoryLabel(category)
  } else if (tag) {
    prompts = getPromptsByTag(tag)
    activeFilter = `#${tag}`
  }

  // 取前 PAGE_SIZE 条作为初始数据
  const initialPrompts = prompts.slice(0, PAGE_SIZE)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        {/* 左侧筛选栏 */}
        <aside className="hidden w-56 shrink-0 lg:block">
          {/* 分类 */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">分类</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/explore"
                  className={`block rounded px-3 py-1.5 text-sm transition-colors ${
                    !activeFilter
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
                >
                  全部
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={`/explore?category=${encodeURIComponent(cat.name)}`}
                    className={`flex items-center justify-between rounded px-3 py-1.5 text-sm transition-colors ${
                      category === cat.name
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    <span>{getCategoryLabel(cat.name)}</span>
                    <span className="text-xs text-zinc-600">{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 标签 */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 20).map((t) => (
                <Link
                  key={t.name}
                  href={`/explore?tag=${encodeURIComponent(t.name)}`}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    tag === t.name
                      ? 'bg-white text-zinc-900'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* 右侧内容 */}
        <div className="flex-1">
          {/* 标题 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              {activeFilter ? (
                <>
                  {activeFilter}
                  <span className="ml-2 text-sm font-normal text-zinc-500">
                    ({prompts.length} 个提示词)
                  </span>
                </>
              ) : (
                '全部提示词'
              )}
            </h1>
          </div>

          {/* 无限滚动瀑布流 */}
          <InfiniteGrid
            initialPrompts={initialPrompts}
            category={category}
            tag={tag}
            q={q}
          />
        </div>
      </div>
    </div>
  )
}
