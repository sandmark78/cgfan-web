import { getAllPrompts, getAllCategories, getAllTags, getPromptsByCategory, getPromptsByTag } from '@/lib/prompts'
import { InfiniteGrid } from '@/components/infinite-grid'
import { PromptGrid } from '@/components/prompt/prompt-grid'
import { getCategoryLabel } from '@/lib/category-map'
import Link from 'next/link'
import type { Metadata } from 'next'
import Pagination from '@/components/pagination'
import { RandomButton } from '@/components/random-button'

export const runtime = 'edge'

const ALL_MODELS = ['GPT Image 2', 'Midjourney', 'Gemini']
const ALL_DIFFICULTIES = ['intermediate', 'advanced']

function getModelIcon(model: string) {
  const m = model.toLowerCase()
  if (m.includes('gpt')) return '🤖'
  if (m.includes('midjourney')) return '🎨'
  if (m.includes('gemini')) return '🔮'
  if (m.includes('grok')) return '⚡'
  if (m.includes('firefly')) return '✨'
  if (m.includes('seedream')) return '🌙'
  if (m.includes('chatgpt')) return '💬'
  return '🛠'
}

function getDifficultyLabel(d: string) {
  return d === 'advanced' ? '进阶' : '入门'
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; model?: string; difficulty?: string; page?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const { category, tag, q, model, difficulty, page } = params
  const currentPage = Math.max(1, parseInt(page || '1', 10))
  const baseUrl = 'https://www.cgfan.com'

  let title = '探索'
  let description = '浏览精选 AI 提示词，涵盖写实、动漫、3D、摄影等风格，支持 GPT-Image、Midjourney 等模型，一键复制即用。'

  if (category) { title = getCategoryLabel(category); description = `浏览 ${getCategoryLabel(category)} 风格的 AI 提示词，共多款精选 prompt。` }
  if (tag) { title = `#${tag}`; description = `浏览 #${tag} 标签的 AI 提示词合集。` }
  if (model) { title = `${model} 提示词`; description = `浏览 ${model} 模型生成的 AI 提示词合集。` }
  if (difficulty) { title = `${getDifficultyLabel(difficulty)}提示词`; description = `浏览 ${getDifficultyLabel(difficulty)} 难度的 AI 提示词合集。` }
  if (q) { title = `搜索: ${q}`; description = `搜索 "${q}" 相关的 AI 提示词结果。` }

  if (currentPage > 1) { title += ` 第${currentPage}页`; description += ` 第 ${currentPage} 页。` }

  let canonical = `${baseUrl}/explore`
  const paramsStr = new URLSearchParams()
  if (category) paramsStr.set('category', category)
  if (tag) paramsStr.set('tag', tag)
  if (model) paramsStr.set('model', model)
  if (difficulty) paramsStr.set('difficulty', difficulty)
  if (q) paramsStr.set('q', q)
  if (currentPage > 1) paramsStr.set('page', String(currentPage))
  const query = paramsStr.toString()
  if (query) canonical += `?${query}`

  return { title, description, alternates: { canonical }, openGraph: { title: `${title} | CGfan`, description } }
}

const PAGE_SIZE = 20

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; model?: string; difficulty?: string }>
}) {
  const params = await searchParams
  const { category, tag, q, model, difficulty } = params

  const categories = getAllCategories()
  const tags = getAllTags()

  // 统计模型和难度分布
  const allPrompts = getAllPrompts()
  const modelCounts: Record<string, number> = {}
  const diffCounts: Record<string, number> = {}
  allPrompts.forEach(p => {
    const m = ALL_MODELS.find(m => p.model.toLowerCase().includes(m.toLowerCase().split(' ')[0].toLowerCase())) || p.model
    modelCounts[m] = (modelCounts[m] || 0) + 1
    diffCounts[p.difficulty] = (diffCounts[p.difficulty] || 0) + 1
  })

  let prompts = [...allPrompts].sort((a, b) => {
    const addedA = a.added || '';
    const addedB = b.added || '';
    if (addedA && addedB) return addedB.localeCompare(addedA);
    return 0;
  })
  let activeFilter = ''

  if (q) {
    const query = q.toLowerCase()
    prompts = prompts.filter(p =>
      p.title.toLowerCase().includes(query) || p.prompt.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query)) || p.author.toLowerCase().includes(query) ||
      p.model.toLowerCase().includes(query)
    )
    activeFilter = `"${q}"`
  } else if (category) {
    prompts = getPromptsByCategory(category)
    activeFilter = getCategoryLabel(category)
  } else if (tag) {
    prompts = getPromptsByTag(tag)
    activeFilter = `#${tag}`
  } else if (model) {
    prompts = prompts.filter(p => p.model.toLowerCase().includes(model.toLowerCase().split(' ')[0].toLowerCase()))
    activeFilter = model
  } else if (difficulty) {
    prompts = prompts.filter(p => p.difficulty === difficulty)
    activeFilter = getDifficultyLabel(difficulty)
  }

  const initialPrompts = prompts.slice(0, PAGE_SIZE)

  const buildUrl = (key: string, value: string | null) => {
    const p = new URLSearchParams()
    if (category && key !== 'category') p.set('category', category)
    if (tag && key !== 'tag') p.set('tag', tag)
    if (model && key !== 'model') p.set('model', model)
    if (difficulty && key !== 'difficulty') p.set('difficulty', difficulty)
    if (q && key !== 'q') p.set('q', q)
    if (value) p.set(key, value)
    const s = p.toString()
    return `/explore${s ? `?${s}` : ''}`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          {/* 分类 */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">分类</h3>
            <ul className="space-y-0.5">
              <li>
                <Link href={buildUrl('category', null)}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${!category && !tag && !model && !difficulty && !q ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>
                  全部
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.name}>
                  <Link href={buildUrl('category', cat.name)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${category === cat.name ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>
                    <span>{getCategoryLabel(cat.name)}</span>
                    <span className="text-xs text-zinc-600">{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 模型 */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">模型</h3>
            <ul className="space-y-0.5">
              {ALL_MODELS.map(m => (
                <li key={m}>
                  <Link href={buildUrl('model', m)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${model === m ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>
                    <span><span className="mr-1.5">{getModelIcon(m)}</span>{m}</span>
                    <span className="text-xs text-zinc-600">{modelCounts[m] || 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 难度 */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">难度</h3>
            <ul className="space-y-0.5">
              {ALL_DIFFICULTIES.map(d => (
                <li key={d}>
                  <Link href={buildUrl('difficulty', d)}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${difficulty === d ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>
                    <span>{getDifficultyLabel(d)}</span>
                    <span className="text-xs text-zinc-600">{diffCounts[d] || 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 标签 */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 15).map(t => (
                <Link key={t.name} href={buildUrl('tag', t.name)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${tag === t.name ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'}`}>
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeFilter ? (
                <>{activeFilter} <span className="ml-2 text-sm font-normal text-zinc-500">({prompts.length} 个提示词)</span></>
              ) : (
                <>全部提示词 <span className="ml-2 text-sm font-normal text-zinc-500">({prompts.length} 个提示词)</span></>
              )}
            </h1>
            <RandomButton slugs={prompts.map(p => p.slug)} />
          </div>

          {prompts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mb-6 text-6xl">🔍</div>
              <h3 className="mb-3 font-serif text-xl font-bold text-gray-900 dark:text-white">
                {q ? `没有找到「${q}」相关的结果` : '这里还没有内容'}
              </h3>
              <p className="mb-3 text-gray-500 dark:text-gray-400">
                {q ? '试试其他关键词，或者换个筛选条件' : '换个分类或标签试试'}
              </p>
              <div className="mx-auto mt-8 max-w-md rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/50">
                <p className="text-sm italic text-gray-500 dark:text-gray-400">「你删掉的，比你画下的更重要。」</p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">— 留白主义者</p>
              </div>
              <Link href="/explore" className="btn-primary mt-8 inline-block">浏览全部</Link>
            </div>
          ) : (
            <InfiniteGrid
              initialPrompts={initialPrompts}
              category={category}
              tag={tag}
              q={q}
              model={model}
              difficulty={difficulty}
            />
          )}
        </div>
      </div>
    </div>
  )
}