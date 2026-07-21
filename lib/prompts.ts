import promptsData from './prompts-data.json'

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
  date: string
  source: string
  author: string
  prompt: string
  negativePrompt: string
  parameters: Record<string, string>
}

const staticPrompts = promptsData as unknown as PromptData[]

/**
 * 获取所有提示词
 */
export function getAllPrompts(): PromptData[] {
  return staticPrompts
}

/**
 * 根据 slug 获取单个提示词
 */
export function getPromptBySlug(slug: string): PromptData | null {
  return staticPrompts.find((p) => p.slug === slug) || null
}

/**
 * 获取所有分类
 */
export function getAllCategories(): { name: string; count: number }[] {
  const categoryMap = new Map<string, number>()

  staticPrompts.forEach((p) => {
    categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1)
  })

  return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
}

/**
 * 获取所有标签
 */
export function getAllTags(): { name: string; count: number }[] {
  const tagMap = new Map<string, number>()

  staticPrompts.forEach((p) => {
    p.tags.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    })
  })

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * 按分类筛选提示词
 */
export function getPromptsByCategory(category: string): PromptData[] {
  return staticPrompts.filter((p) => p.category === category)
}

/**
 * 按标签筛选提示词
 */
export function getPromptsByTag(tag: string): PromptData[] {
  return staticPrompts.filter((p) => p.tags.includes(tag))
}
