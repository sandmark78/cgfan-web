import { getGitHubFile, putGitHubFile, deleteGitHubFile, listGitHubDirectory } from '@/lib/github'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export const runtime = 'edge'

// GET /api/admin/prompts - 获取所有提示词
export async function GET() {
  try {
    await requireAdmin()
    
    const files = await listGitHubDirectory('content/prompts')
    const prompts = []

    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const fileData = await getGitHubFile(file.path)
        if (fileData) {
          const prompt = parseMarkdown(fileData.content, file.name)
          prompts.push(prompt)
        }
      }
    }

    // 按日期排序
    prompts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ prompts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// POST /api/admin/prompts - 创建提示词
export async function POST(request: Request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const markdown = generateMarkdown(body)
    const filename = `content/prompts/${body.slug}.md`
    
    const success = await putGitHubFile(
      filename,
      markdown,
      `feat: 添加提示词 ${body.title}`
    )

    if (!success) {
      throw new Error('Failed to create file')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// PUT /api/admin/prompts - 更新提示词
export async function PUT(request: Request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const filename = `content/prompts/${body.slug}.md`
    
    // 获取现有文件的 SHA
    const existingFile = await getGitHubFile(filename)
    if (!existingFile) {
      throw new Error('File not found')
    }

    const markdown = generateMarkdown(body)
    const success = await putGitHubFile(
      filename,
      markdown,
      `update: 更新提示词 ${body.title}`,
      existingFile.sha
    )

    if (!success) {
      throw new Error('Failed to update file')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// DELETE /api/admin/prompts - 删除提示词
export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const filename = `content/prompts/${slug}.md`
    const fileData = await getGitHubFile(filename)
    
    if (!fileData) {
      throw new Error('File not found')
    }

    const success = await deleteGitHubFile(
      filename,
      fileData.sha,
      `delete: 删除提示词 ${slug}`
    )

    if (!success) {
      throw new Error('Failed to delete file')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// 解析 Markdown 文件
function parseMarkdown(content: string, filename: string): any {
  const lines = content.split('\n')
  const result: any = {
    slug: filename.replace('.md', ''),
    title: '',
    prompt: '',
    negativePrompt: '',
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
          result.tags = value.replace(/[\[\]]/g, '').split(',').map((t: string) => t.trim())
        } else if (key in result) {
          result[key] = value
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

// 生成 Markdown 文件
function generateMarkdown(data: any): string {
  const frontmatter = `---
title: "${data.title}"
slug: ${data.slug}
model: ${data.model}
category: ${data.category}
tags: [${data.tags.map((t: string) => `"${t}"`).join(', ')}]
difficulty: ${data.difficulty}
cover: ${data.cover}
date: '${data.date}'
source: ${data.source || ''}
author: ${data.author || ''}
---

## Prompt

${data.prompt}

${data.negativePrompt ? `## Negative Prompt\n\n${data.negativePrompt}` : ''}
`

  return frontmatter
}
