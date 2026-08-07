import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxgmtmcspzetyxkhemsw.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Z210bWNzcHpldHl4a2hlbXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2Mjg0MDEsImV4cCI6MjEwMDIwNDQwMX0.OhDCjNSnOt1HnwQ8zVtQsJ-gLl6_jpxoJ6V4CbhNP5c'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100') // 每页 100 个
  const offset = parseInt(searchParams.get('offset') || '0') // 当前页内偏移
  const limit = parseInt(searchParams.get('limit') || '20') // 每次返回 20 个
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const model = searchParams.get('model')
  const difficulty = searchParams.get('difficulty')

  // 构建查询
  let query = supabase
    .from('prompts')
    .select('*', { count: 'exact' })
    .order('added', { ascending: false })
    .order('created_at', { ascending: false })

  // 应用筛选
  if (category) {
    query = query.eq('category', category)
  }
  if (tag) {
    query = query.contains('tags', [tag])
  }
  if (model) {
    query = query.ilike('model', `%${model}%`)
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty)
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,prompt.ilike.%${q}%,author.ilike.%${q}%`)
  }

  // 分页：计算全局偏移
  const from = (page - 1) * pageSize + offset
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('查询失败:', error)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }

  const totalPages = Math.ceil((count || 0) / pageSize)
  const currentOffset = offset + limit
  const hasMoreInPage = currentOffset < pageSize && from + limit < (count || 0)

  return NextResponse.json({
    prompts: data || [],
    page,
    pageSize,
    offset: currentOffset,
    total: count || 0,
    totalPages,
    hasMore: hasMoreInPage || page < totalPages,
    pageTotal: Math.min(pageSize, (count || 0) - (page - 1) * pageSize),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=59',
    },
  })
}
