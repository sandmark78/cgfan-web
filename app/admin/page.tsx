import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from './AdminDashboard'
import { getGitHubFile, listGitHubDirectory } from '@/lib/github'

export const runtime = 'edge'

interface Prompt {
  slug: string
  title: string
  prompt: string
  negative_prompt?: string
  model: string
  category: string
  tags: string[]
  difficulty: string
  cover: string
  date: string
  source?: string
  author?: string
  parameters?: Record<string, string>
}

// 解析 Markdown 文件
function parseMarkdown(content: string, filename: string): Prompt {
  const lines = content.split('\n')
  const result: any = {
    slug: filename.replace('.md', ''),
    title: '',
    prompt: '',
    negative_prompt: '',
    model: '',
    category: '',
    tags: [],
    difficulty: 'intermediate',
    cover: '',
    date: '',
    source: '',
    author: '',
    parameters: {},
  }

  let inFrontmatter = false
  let inPrompt = false
  let inNegativePrompt = false
  let promptLines: string[] = []
  let negativePromptLines: string[] = []

  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }

    if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*(.+)$/)
      if (match) {
        const [, key, value] = match
        if (key === 'tags') {
          result.tags = value.replace(/[\[\]]/g, '').split(',').map((t: string) => t.trim().replace(/^["']|["']$/g, ''))
        } else if (key in result) {
          result[key] = value.replace(/^["']|["']$/g, '')
        }
      }
    } else if (line.startsWith('## Prompt')) {
      inPrompt = true
      inNegativePrompt = false
    } else if (line.startsWith('## Negative Prompt')) {
      inPrompt = false
      inNegativePrompt = true
    } else if (inPrompt) {
      promptLines.push(line)
    } else if (inNegativePrompt) {
      negativePromptLines.push(line)
    }
  }

  result.prompt = promptLines.join('\n').trim()
  result.negativePrompt = negativePromptLines.join('\n').trim()

  return result
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = await isAdmin()

  if (!admin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">无权限访问</h1>
          <p className="text-gray-600">此页面仅限管理员访问</p>
        </div>
      </div>
    )
  }

  // 服务端获取提示词列表
  let prompts: Prompt[] = []
  
  if (process.env.GITHUB_TOKEN) {
    try {
      const categories = await listGitHubDirectory('content/prompts')
      
      for (const category of categories) {
        if (category.type === 'dir') {
          const files = await listGitHubDirectory(category.path)
          
          for (const file of files) {
            if (file.name.endsWith('.md')) {
              const fileData = await getGitHubFile(file.path)
              if (fileData) {
                const prompt = parseMarkdown(fileData.content, file.name)
                prompts.push(prompt)
              }
            }
          }
        }
      }
      
      // 按日期排序
      prompts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

  return <AdminDashboard user={user} initialPrompts={prompts} hasGithubToken={!!process.env.GITHUB_TOKEN} />
}
