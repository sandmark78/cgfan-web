#!/usr/bin/env node
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

console.log('=== 环境变量检查 ===')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已配置' : '✗ 缺失')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ 已配置' : '✗ 缺失')
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ 已配置' : '✗ 缺失')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ 环境变量缺失，无法继续')
  process.exit(1)
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 获取今天日期（北京时间）
const now = new Date()
const beijingOffset = 8 * 60 * 60 * 1000
const beijingNow = new Date(now.getTime() + beijingOffset)
const today = beijingNow.toISOString().split('T')[0]

console.log(`\n=== 今天日期 ===`)
console.log('Today:', today)

// 检查今天的 daily_features
console.log(`\n=== daily_features 表检查 ===`)
const { data: todayFeature, error } = await sb
  .from('daily_features')
  .select('*')
  .eq('date', today)

if (error) {
  console.error('查询错误:', error.message)
} else {
  console.log(`今天 (${today}) 的记录数:`, todayFeature?.length || 0)
  if (todayFeature?.length) {
    todayFeature.forEach(f => console.log(`  - slug: ${f.slug}, highlight: ${f.highlight}`))
  }
}

// 检查最近的 daily_features
const { data: recent } = await sb
  .from('daily_features')
  .select('slug, date, highlight')
  .order('date', { ascending: false })
  .limit(5)

console.log('\n最近 5 条 daily_features:')
recent?.forEach(f => console.log(`  ${f.date}: ${f.slug} - ${f.highlight}`))

// 检查订阅者
console.log(`\n=== subscribers 表检查 ===`)
const { data: allSubs, error: subsError } = await sb
  .from('subscribers')
  .select('email, status, confirmed')

if (subsError) {
  console.error('查询错误:', subsError.message)
} else {
  console.log('总订阅者数:', allSubs?.length || 0)
  
  // 尝试两种状态字段
  const confirmedByStatus = allSubs?.filter(s => s.status === 'confirmed') || []
  const confirmedByFlag = allSubs?.filter(s => s.confirmed === true) || []
  
  console.log('status=confirmed 的数量:', confirmedByStatus.length)
  console.log('confirmed=true 的数量:', confirmedByFlag.length)
  
  const confirmed = confirmedByStatus.length > 0 ? confirmedByStatus : confirmedByFlag
  
  if (confirmed.length > 0) {
    console.log('\n已确认的订阅者:')
    confirmed.forEach(s => console.log(`  - ${s.email}`))
  } else {
    console.log('\n⚠️  没有已确认的订阅者')
  }
}
