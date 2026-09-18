#!/usr/bin/env node
/**
 * 手动为今天生成每日一味并发送邮件
 * 从 lib/daily-feature.ts 读取今天的配置
 */

import { config } from 'dotenv'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_API_KEY) {
  console.error('❌ 环境变量缺失')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

// 获取今天日期（北京时间）
const now = new Date()
const beijingOffset = 8 * 60 * 60 * 1000
const beijingNow = new Date(now.getTime() + beijingOffset)
const today = beijingNow.toISOString().split('T')[0]

console.log(`📅 今天: ${today}`)

// 从 lib/daily-feature.ts 读取今天的配置
const filePath = join(process.cwd(), 'lib', 'daily-feature.ts')
const content = readFileSync(filePath, 'utf-8')

// 匹配今天的条目
const todayRegex = new RegExp(`date:\\s*'${today}'[\\s\\S]*?^\\s{2}\\}`, 'm')
const match = content.match(todayRegex)

if (!match) {
  console.error(`❌ lib/daily-feature.ts 中没有今天 (${today}) 的配置`)
  console.log('\n请检查:')
  console.log('1. 文件路径: lib/daily-feature.ts')
  console.log('2. 日期格式: YYYY-MM-DD')
  console.log('3. 今天的日期:', today)
  process.exit(1)
}

const block = match[0]
console.log('\n✅ 找到今天的配置:')
console.log(block.substring(0, 200) + '...')

// 提取字段
const extractField = (field) => {
  const m = block.match(new RegExp(`${field}:\\s*(?:'([^']*)'|"([^"]*)")`))
  return m ? (m[1] ?? m[2]) : null
}

const slug = extractField('slug')
const curatorNote = extractField('curatorNote')
const highlight = extractField('highlight')
const tip = extractField('tip')

if (!slug) {
  console.error('❌ 无法提取 slug')
  process.exit(1)
}

console.log('\n📝 提取的数据:')
console.log('  slug:', slug)
console.log('  highlight:', highlight)
console.log('  curatorNote:', curatorNote?.substring(0, 100) + '...')
console.log('  tip:', tip?.substring(0, 100) + '...')

// 检查数据库是否已有今天的记录
const { data: existing } = await sb
  .from('daily_features')
  .select('*')
  .eq('date', today)

if (existing && existing.length > 0) {
  console.log('\n⚠️  数据库中已存在今天的记录，将更新...')
  const { error } = await sb
    .from('daily_features')
    .update({
      slug,
      curator_note: curatorNote,
      highlight,
      tip,
      updated_at: new Date().toISOString()
    })
    .eq('date', today)
  
  if (error) {
    console.error('更新失败:', error.message)
    process.exit(1)
  }
  console.log('✅ 已更新')
} else {
  console.log('\n📝 插入新记录到数据库...')
  const { error } = await sb
    .from('daily_features')
    .insert({
      date: today,
      slug,
      curator_note: curatorNote,
      highlight,
      tip
    })
  
  if (error) {
    console.error('插入失败:', error.message)
    process.exit(1)
  }
  console.log('✅ 已插入')
}

// 获取已确认的订阅者
console.log('\n📧 获取订阅者...')
const { data: subscribers, error: subsError } = await sb
  .from('subscribers')
  .select('email, status, confirmed')

if (subsError) {
  console.error('查询订阅者失败:', subsError.message)
  process.exit(1)
}

// 兼容两种字段名
const confirmed = subscribers.filter(s => s.status === 'confirmed' || s.confirmed === true)

console.log(`总订阅者: ${subscribers.length}`)
console.log(`已确认: ${confirmed.length}`)

if (confirmed.length === 0) {
  console.log('\n⚠️  没有已确认的订阅者，跳过发送')
  process.exit(0)
}

console.log('\n📬 准备发送邮件...')
console.log(`收件人:`)
confirmed.forEach(s => console.log(`  - ${s.email}`))

// 发送邮件
const { Resend } = await import('resend')
const resend = new Resend(RESEND_API_KEY)

let sentCount = 0
let failedCount = 0

for (const subscriber of confirmed) {
  let retries = 3
  let success = false
  
  while (retries > 0 && !success) {
    try {
      const result = await resend.emails.send({
        from: 'CGfan <noreply@send.cgfan.com>',
        to: subscriber.email,
        subject: `每日一味：${highlight}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2D5F3E; font-size: 24px; margin-bottom: 16px;">${highlight}</h1>
            <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              ${curatorNote}
            </p>
            ${tip ? `
              <div style="background: #f0f9f4; border-left: 4px solid #2D5F3E; padding: 16px; margin-bottom: 24px;">
                <p style="color: #2D5F3E; font-size: 14px; margin: 0;">
                  <strong>💡 实用技巧</strong><br/>
                  ${tip}
                </p>
              </div>
            ` : ''}
            <a href="https://www.cgfan.com/prompt/${slug}" style="display: inline-block; background: #2D5F3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              查看完整提示词
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              退订请 <a href="https://www.cgfan.com/subscribe/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color: #999;">点击这里</a>
            </p>
          </div>
        `,
      })
      
      if (result.error) {
        throw new Error(`Resend API error: ${JSON.stringify(result.error)}`)
      }
      
      sentCount++
      success = true
      console.log(`✅ 已发送给 ${subscriber.email}`)
    } catch (error) {
      retries--
      if (retries > 0) {
        console.log(`⚠️  重试 ${3-retries}/3 for ${subscriber.email}: ${error.message}`)
        await new Promise(r => setTimeout(r, 2000 * (3-retries)))
      } else {
        failedCount++
        console.error(`❌ 发送失败 ${subscriber.email}: ${error.message}`)
      }
    }
  }
}

// 记录发送日志
await sb.from('daily_emails').insert({
  prompt_slug: slug,
  recipient_count: sentCount,
  sent_at: new Date().toISOString()
})

console.log(`\n✅ 完成！成功发送 ${sentCount}/${confirmed.length} 封邮件`)
if (failedCount > 0) {
  console.log(`⚠️  失败 ${failedCount} 封`)
}
