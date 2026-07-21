import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

/**
 * 构建脚本：将 Markdown 文件转换为静态 JSON
 * 在 Next.js build 之前运行
 */

interface PromptData {
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

function parseMarkdownFile(filePath: string): PromptData {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

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
      const lines = section.split('\n').filter((line) => line.includes('|'))
      lines.forEach((line) => {
        const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean)
        if (cells.length === 2 && cells[0] !== 'Setting') {
          parameters[cells[0]] = cells[1]
        }
      })
    }
  })

  return {
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
  }
}

function traverseDir(dir: string): PromptData[] {
  const prompts: PromptData[] = []
  const items = fs.readdirSync(dir)

  items.forEach((item) => {
    const itemPath = path.join(dir, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      prompts.push(...traverseDir(itemPath))
    } else if (item.endsWith('.md')) {
      prompts.push(parseMarkdownFile(itemPath))
    }
  })

  return prompts
}

const promptsDir = path.join(process.cwd(), 'content/prompts')
const prompts = traverseDir(promptsDir)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const outputPath = path.join(process.cwd(), 'lib/prompts-data.json')
fs.writeFileSync(outputPath, JSON.stringify(prompts, null, 2))

console.log(`✅ Generated ${prompts.length} prompts to ${outputPath}`)
