import { NextRequest, NextResponse } from 'next/server'
import { getAllPrompts } from '@/lib/prompts'

export const runtime = 'edge'
export const revalidate = 0  // 禁用缓存，每次请求都读取最新数据

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const model = searchParams.get('model')
  const difficulty = searchParams.get('difficulty')

  let prompts = await getAllPrompts()
  prompts = [...prompts].sort((a, b) => {
    const addedA = (a as any).added || '';
    const addedB = (b as any).added || '';
    if (addedA && addedB) return addedB.localeCompare(addedA);
    return 0;
  })

  if (q) {
    const query = q.toLowerCase()
    prompts = prompts.filter((p) =>
      p.title.toLowerCase().includes(query) ||
      p.prompt.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query)) ||
      p.author.toLowerCase().includes(query) ||
      p.model.toLowerCase().includes(query)
    )
  } else if (category) {
    prompts = prompts.filter((p) => p.category === category)
  } else if (tag) {
    prompts = prompts.filter((p) => p.tags.includes(tag))
  }

  if (model) {
    prompts = prompts.filter((p) => p.model.toLowerCase().includes(model.toLowerCase().split(' ')[0].toLowerCase()))
  }
  if (difficulty) {
    prompts = prompts.filter((p) => p.difficulty === difficulty)
  }

  const total = prompts.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const paginatedPrompts = prompts.slice(startIndex, endIndex)

  return NextResponse.json({
    prompts: paginatedPrompts,
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=59',
    },
  })
}