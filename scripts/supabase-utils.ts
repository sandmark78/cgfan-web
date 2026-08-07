import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxgmtmcspzetyxkhemsw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量')
  process.exit(1)
}

/**
 * 获取 Supabase 客户端（使用 service role key，有完整权限）
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * 从 Supabase 获取所有提示词
 */
export async function getAllPrompts(): Promise<any[]> {
  const supabase = getSupabaseClient()
  
  let allData: any[] = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('added', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('获取提示词失败:', error)
      return []
    }

    if (data.length === 0) {
      hasMore = false
    } else {
      allData = allData.concat(data)
      page++
      if (data.length < pageSize) {
        hasMore = false
      }
    }
  }

  return allData
}

/**
 * 批量更新提示词到 Supabase
 */
export async function upsertPrompts(prompts: any[]): Promise<number> {
  const supabase = getSupabaseClient()
  let successCount = 0

  // 字段映射：camelCase → snake_case
  function mapFields(p: any): any {
    const mapping: Record<string, string> = {
      'sourceLink': 'source_link',
      'authorLink': 'author_link',
      'negativePrompt': 'negative_prompt',
      'promptDNA': 'prompt_dna',
    }
    const result: any = {}
    for (const [key, value] of Object.entries(p)) {
      const mappedKey = mapping[key] || key
      result[mappedKey] = value
    }
    // 删除不含法的字段（JavaScript 特有）
    delete result.mtime
    return result
  }

  // 分批插入（每批 100 条）
  const batchSize = 100
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize).map(mapFields)
    
    const { data, error } = await supabase
      .from('prompts')
      .upsert(batch, { onConflict: 'slug' })
      .select()

    if (error) {
      console.error(`批量插入失败 (批次 ${i / batchSize + 1}):`, error)
    } else {
      successCount += data?.length || 0
    }
  }

  return successCount
}

/**
 * 删除提示词（按 slug）
 */
export async function deletePrompts(slugs: string[]): Promise<number> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('prompts')
    .delete()
    .in('slug', slugs)

  if (error) {
    console.error('删除失败:', error)
    return 0
  }

  return slugs.length
}

/**
 * 更新单个提示词
 */
export async function updatePrompt(slug: string, updates: Partial<any>): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('prompts')
    .update(updates)
    .eq('slug', slug)

  if (error) {
    console.error(`更新失败 (${slug}):`, error)
    return false
  }

  return true
}
