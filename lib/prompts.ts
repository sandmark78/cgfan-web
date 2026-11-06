import { createClient } from '@supabase/supabase-js'

/**
 * 提示词数据结构
 */
export interface PromptData {
  title: string
  slug: string
  model: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  cover: string
  images?: string[]  // 多图支持：所有图片路径（cover 是第一张）
  date: string
  added: string
  source: string
  sourceLink: string
  author: string
  authorLink?: string
  prompt: string
  negativePrompt: string
  parameters: Record<string, string>
  likeCount?: number
  promptDNA?: {
    dna: {
      styles?: [string, number][]
      lighting?: [string, number][]
      composition?: [string, number][]
      material?: [string, number][]
    }
    metrics: {
      complexity: number
      reproducibility: number
    }
    recommended_models: {
      model: string
      level: string
      score: number
    }[]
  }
}

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxgmtmcspzetyxkhemsw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbG...NP5c'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 内存缓存 - Edge Runtime 全局变量
 * 缓存时间：5 分钟（300 秒）
 */
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// 全局缓存（Edge Runtime 会保持全局变量）
const globalCache = (globalThis as any).__promptsCache = (globalThis as any).__promptsCache || {
  allPrompts: null as CacheEntry<PromptData[]> | null,
  promptBySlug: {} as Record<string, CacheEntry<PromptData>>,
}

/**
 * 将数据库记录转换为 PromptData 格式
 */
function dbRowToPromptData(row: any): PromptData {
  return {
    title: row.title,
    slug: row.slug,
    model: row.model || '',
    category: row.category || '',
    tags: row.tags || [],
    difficulty: row.difficulty || 'intermediate',
    cover: row.cover || '',
    images: row.images || [row.cover],
    date: row.date || '',
    added: row.added || '',
    source: row.source || '',
    sourceLink: row.source_link || '',
    author: row.author || '',
    authorLink: row.author_link,
    prompt: row.prompt || '',
    negativePrompt: row.negative_prompt || '',
    parameters: row.parameters || {},
    promptDNA: row.prompt_dna
  }
}

/**
 * 获取所有提示词（带内存缓存）
 */
export async function getAllPrompts(): Promise<PromptData[]> {
  // 检查缓存
  if (globalCache.allPrompts && Date.now() - globalCache.allPrompts.timestamp < CACHE_TTL) {
    return globalCache.allPrompts.data
  }

  // Supabase 默认限制 1000 行，需要分页获取全部数据
  const pageSize = 1000
  let allData: any[] = []
  let from = 0
  
  while (true) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('added', { ascending: false })
      .range(from, from + pageSize - 1)
    
    if (error) {
      console.error('获取所有提示词失败:', error)
      break
    }
    
    if (!data || data.length === 0) break
    
    allData = allData.concat(data)
    
    if (data.length < pageSize) break
    from += pageSize
  }
  
  const result = allData.map(dbRowToPromptData)
  
  // 写入缓存
  globalCache.allPrompts = { data: result, timestamp: Date.now() }
  
  return result
}

/**
 * 根据 slug 获取单个提示词（带内存缓存）
 */
export async function getPromptBySlug(slug: string): Promise<PromptData | null> {
  // 检查缓存
  const cached = globalCache.promptBySlug[slug]
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  const result = dbRowToPromptData(data)
  
  // 写入缓存
  globalCache.promptBySlug[slug] = { data: result, timestamp: Date.now() }
  
  return result
}

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<{ name: string; count: number }[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('category')
    .limit(2000)

  if (error) {
    console.error('获取分类失败:', error)
    return []
  }

  const categoryMap = new Map<string, number>()
  data.forEach((row: any) => {
    if (row.category) {
      categoryMap.set(row.category, (categoryMap.get(row.category) || 0) + 1)
    }
  })

  return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
}

/**
 * 获取所有标签
 */
export async function getAllTags(): Promise<{ name: string; count: number }[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('tags')
    .limit(2000)

  if (error) {
    console.error('获取标签失败:', error)
    return []
  }

  const tagMap = new Map<string, number>()
  data.forEach((row: any) => {
    if (row.tags && Array.isArray(row.tags)) {
      row.tags.forEach((tag: string) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    }
  })

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * 按分类筛选提示词
 */
export async function getPromptsByCategory(category: string): Promise<PromptData[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('category', category)
    .order('added', { ascending: false })

  if (error) {
    console.error('按分类筛选失败:', error)
    return []
  }

  return data.map(dbRowToPromptData)
}

/**
 * 按标签筛选提示词
 */
export async function getPromptsByTag(tag: string): Promise<PromptData[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .contains('tags', [tag])
    .order('added', { ascending: false })

  if (error) {
    console.error('按标签筛选失败:', error)
    return []
  }

  return data.map(dbRowToPromptData)
}
