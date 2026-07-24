import { NextRequest, NextResponse } from 'next/server'
import { getAllPrompts } from '@/lib/prompts'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')

  let prompts = getAllPrompts()
  // 数据已按上传时间升序排列，API 需要返回最新优先
  prompts = [...prompts].reverse()

  // 应用筛选
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

  // 计算分页
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
  })
}
