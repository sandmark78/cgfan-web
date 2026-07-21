import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

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

/**
 * 获取所有提示词
 */
export function getAllPrompts(): PromptData[] {
  const promptsDir = path.join(process.cwd(), 'content/prompts')
  const prompts: PromptData[] = []

  // 递归遍历所有分类目录
  function traverseDir(dir: string) {
    const items = fs.readdirSync(dir)

    items.forEach((item) => {
      const itemPath = path.join(dir, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        traverseDir(itemPath)
      } else if (item.endsWith('.md')) {
        const fileContent = fs.readFileSync(itemPath, 'utf-8')
        const { data, content } = matter(fileContent)

        // 解析 Markdown 内容，提取 Prompt、Negative Prompt 和 Parameters
        const sections = content.split(/^## /m)
        let prompt = ''
        let negativePrompt = ''
        const parameters: Record<string, string> = {}

        sections.forEach((section) => {
          if (section.startsWith('Prompt\n')) {
            prompt = section.replace('Prompt\n', '').trim()
          } else if (section.startsWith('Negative Prompt\n')) {
            negativePrompt = section.replace('Negative Prompt\n', '').trim()
          } else if (section.startsWith('Parameters\n')) {
            // 解析表格
            const lines = section.split('\n').filter((line) => line.includes('|'))
            lines.forEach((line) => {
              const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean)
              if (cells.length === 2 && cells[0] !== 'Setting') {
                parameters[cells[0]] = cells[1]
              }
            })
          }
        })

        prompts.push({
          title: data.title,
          slug: data.slug,
          model: data.model,
          category: data.category,
          tags: data.tags || [],
          difficulty: data.difficulty || 'intermediate',
          cover: data.cover || '/images/placeholder.webp',
          date: data.date,
          source: data.source || '',
          author: data.author || 'Unknown',
          prompt,
          negativePrompt,
          parameters,
        })
      }
    })
  }

  traverseDir(promptsDir)

  // 按日期排序（最新在前）
  return prompts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * 根据 slug 获取单个提示词
 */
export function getPromptBySlug(slug: string): PromptData | null {
  const prompts = getAllPrompts()
  return prompts.find((p) => p.slug === slug) || null
}

/**
 * 获取所有分类
 */
export function getAllCategories(): { name: string; count: number }[] {
  const prompts = getAllPrompts()
  const categoryMap = new Map<string, number>()

  prompts.forEach((p) => {
    categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1)
  })

  return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
}

/**
 * 获取所有标签
 */
export function getAllTags(): { name: string; count: number }[] {
  const prompts = getAllPrompts()
  const tagMap = new Map<string, number>()

  prompts.forEach((p) => {
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
  const prompts = getAllPrompts()
  return prompts.filter((p) => p.category === category)
}

/**
 * 按标签筛选提示词
 */
export function getPromptsByTag(tag: string): PromptData[] {
  const prompts = getAllPrompts()
  return prompts.filter((p) => p.tags.includes(tag))
}
