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
  const labels: Record<string, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级' }
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
    // 优先按 added 降序（最新添加的在前），其次按 slug 降序（保证稳定排序）
    const addedA = a.added || '';
    const addedB = b.added || '';
    if (addedA !== addedB) return addedB.localeCompare(addedA);
    // 相同日期时按 slug 降序
    const slugA = a.slug || '';
    const slugB = b.slug || '';
    return slugB.localeCompare(slugA);
  })
  let activeFilter = ''

  if (q) {
    const query = q.toLowerCase()
    // 改进的搜索：带相关性评分
    const searchResults = prompts.map(p => {
      let score = 0
      const title = p.title.toLowerCase()
      const prompt = p.prompt.toLowerCase()
      const tags = p.tags.map(t => t.toLowerCase())
      const author = p.author.toLowerCase()
      const model = p.model.toLowerCase()
      const category = p.category.toLowerCase()
      
      // 标题完全匹配：权重最高
      if (title === query) score += 100
      // 标题包含：权重高
      else if (title.includes(query)) score += 50
      
      // 标签完全匹配：权重高
      if (tags.some(t => t === query)) score += 40
      // 标签包含：权重中等
      else if (tags.some(t => t.includes(query))) score += 25
      
      // 分类匹配：权重中等
      if (category === query) score += 30
      else if (category.includes(query)) score += 20
      
      // 作者匹配：权重中等
      if (author === query) score += 30
      else if (author.includes(query)) score += 20
      
      // 模型匹配：权重中等
      if (model === query) score += 30
      else if (model.includes(query)) score += 20
      
      // 内容包含：权重较低
      if (prompt.includes(query)) score += 10
      
      return { prompt: p, score }
    }).filter(item => item.score > 0)
    
    // 按相关性排序
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

  // 计算分页
  const totalPages = Math.ceil(prompts.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const pagePrompts = prompts.slice(startIndex, endIndex)

  const buildUrl = (key: string, value: string | null) => {
    const p = new URLSearchParams()
    if (value) p.set(key, value)
    if (currentPage > 1 && key !== 'page') p.set('page', String(currentPage))
    const s = p.toString()
    return `/explore${s ? `?${s}` : ''}`
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 移动端筛选抽屉 */}
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
                  basePath="/explore"
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