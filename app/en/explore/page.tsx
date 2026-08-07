import { getAllPrompts, getAllCategories, getAllTags, getPromptsByCategory, getPromptsByTag } from '@/lib/prompts'
import { PromptCard } from '@/components/prompt/prompt-card'
import { getCategoryLabel } from '@/lib/category-map'
import Link from 'next/link'
import type { Metadata } from 'next'
import Pagination from '@/components/pagination'
import { RandomButton } from '@/components/random-button'
import { FilterDrawer } from '@/components/filter-drawer'

export const runtime = 'edge'

const ALL_MODELS = ['GPT Image 2', 'Midjourney', 'Gemini', '通用 Prompt']
const ALL_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

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
  const labels: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  return labels[d] || d
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

  let title = 'Explore'
  let description = 'Browse curated AI prompts covering realistic, anime, 3D, photography styles. Support GPT-Image, Midjourney and more. Copy and use instantly.'

  if (category) { title = getCategoryLabel(category); description = `Browse AI prompts in ${getCategoryLabel(category)} style.` }
  if (tag) { title = `#${tag}`; description = `Browse AI prompts tagged with #${tag}.` }
  if (model) { title = `${model} Prompts`; description = `Browse AI prompts generated with ${model}.` }
  if (difficulty) { title = `${getDifficultyLabel(difficulty)} Prompts`; description = `Browse ${getDifficultyLabel(difficulty)} level AI prompts.` }
  if (q) { title = `Search: ${q}`; description = `Search results for "${q}".` }

  if (currentPage > 1) { title += ` Page ${currentPage}`; description += ` Page ${currentPage}.` }

  let canonical = `${baseUrl}/en/explore`
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

const PAGE_SIZE = 100

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string; model?: string; difficulty?: string; page?: string }>
}) {
  const params = await searchParams
  const { category, tag, q, model, difficulty, page } = params
  const currentPage = Math.max(1, parseInt(page || '1', 10))

  const categories = getAllCategories()
  const tags = getAllTags().filter(tag => tag.name !== 'AI绘图' && tag.name !== '提示词')

  // Count models and difficulties
  const allPrompts = getAllPrompts()
  const modelCounts: Record<string, number> = {}
  const diffCounts: Record<string, number> = {}
  allPrompts.forEach(p => {
    const m = ALL_MODELS.find(m => p.model.toLowerCase().includes(m.toLowerCase().split(' ')[0].toLowerCase())) || p.model
    modelCounts[m] = (modelCounts[m] || 0) + 1
    diffCounts[p.difficulty] = (diffCounts[p.difficulty] || 0) + 1
  })

  let prompts = [...allPrompts].sort((a, b) => {
    const addedA = String(a.added || '');
    const addedB = String(b.added || '');
    if (addedA && addedB) return addedB.localeCompare(addedA);
    return 0;
  })
  let activeFilter = ''

  if (q) {
    const query = q.toLowerCase()
    const searchResults = prompts.map(p => {
      let score = 0
      const title = p.title.toLowerCase()
      const prompt = p.prompt.toLowerCase()
      const tags = p.tags.map(t => t.toLowerCase())
      const author = p.author.toLowerCase()
      const model = p.model.toLowerCase()
      const category = p.category.toLowerCase()
      
      if (title === query) score += 100
      else if (title.includes(query)) score += 50
      
      if (tags.some(t => t === query)) score += 40
      else if (tags.some(t => t.includes(query))) score += 25
      
      if (category === query) score += 30
      else if (category.includes(query)) score += 20
      
      if (author === query) score += 30
      else if (author.includes(query)) score += 20
      
      if (model === query) score += 30
      else if (model.includes(query)) score += 20
      
      if (prompt.includes(query)) score += 10
      
      return { prompt: p, score }
    }).filter(item => item.score > 0)
    
    searchResults.sort((a, b) => b.score - a.score)
    prompts = searchResults.map(item => item.prompt)
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

  const totalPages = Math.ceil(prompts.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const pagePrompts = prompts.slice(startIndex, endIndex)

  const buildUrl = (key: string, value: string | null) => {
    const p = new URLSearchParams()
    if (value) p.set(key, value)
    if (currentPage > 1 && key !== 'page') p.set('page', String(currentPage))
    const s = p.toString()
    return `/en/explore${s ? `?${s}` : ''}`
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile Filter Drawer */}
        <FilterDrawer
          categories={categories}
          models={ALL_MODELS}
          modelCounts={modelCounts}
          difficulties={ALL_DIFFICULTIES}
          diffCounts={diffCounts}
          tags={tags}
          currentCategory={category}
          currentModel={model}
          currentDifficulty={difficulty}
          currentTag={tag}
          currentPage={currentPage}
        />

        <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          {/* Categories */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Categories</h3>
            <ul className="space-y-0.5">
              <li>
                <Link href={buildUrl('category', null)}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${!category && !tag && !model && !difficulty && !q ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>
                  All
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

          {/* Models */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Models</h3>
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

          {/* Difficulty */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Difficulty</h3>
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

          {/* Tags */}
          <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Popular Tags</h3>
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
                <>{activeFilter} <span className="ml-2 text-sm font-normal text-zinc-500">({prompts.length} prompts)</span></>
              ) : (
                <>All Prompts <span className="ml-2 text-sm font-normal text-zinc-500">({prompts.length} prompts)</span></>
              )}
            </h1>
            <RandomButton slugs={prompts.map(p => p.slug)} />
          </div>

          {prompts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mb-6 text-6xl">🔍</div>
              <h3 className="mb-3 font-serif text-xl font-bold text-gray-900 dark:text-white">
                {q ? `No results for "${q}"` : 'No content yet'}
              </h3>
              <p className="mb-3 text-gray-500 dark:text-gray-400">
                {q ? 'Try different keywords or filters' : 'Try a different category or tag'}
              </p>
              <div className="mx-auto mt-8 max-w-md rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/50">
                <p className="text-sm italic text-gray-500 dark:text-gray-400">"What you delete is more important than what you create."</p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">— Minimalist</p>
              </div>
              <Link href="/en/explore" className="btn-primary mt-8 inline-block">Browse All</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagePrompts.map((prompt, index) => (
                  <div
                    key={prompt.slug}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(index % 20) * 50}ms` }}
                  >
                    <PromptCard prompt={prompt} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  current={currentPage}
                  total={totalPages}
                  basePath="/en/explore"
                  params={{ category, tag, q, model, difficulty }}
                />
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
