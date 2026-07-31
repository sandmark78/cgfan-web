#!/usr/bin/env node
/**
 * 每日一味邮件发送脚本
 * 用于 cron job 定时调用
 * 
 * 数据来源：从 GitHub 读取 lib/daily-feature.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY

async function getTodayFeature() {
  // 从 GitHub 读取 daily-feature.ts
  const response = await fetch('https://raw.githubusercontent.com/sandmark78/cgfan-web/main/lib/daily-feature.ts')
  const content = await response.text()
  
  // 获取今天的日期
  const today = new Date().toISOString().split('T')[0]
  
  // 先找到今天的条目块
  const todayBlockMatch = content.match(new RegExp(`date:\\s*'${today}'[\\s\\S]*?^\\s{2}\\}`, 'm'))
  if (!todayBlockMatch) {
    return null
  }
  const block = todayBlockMatch[0]
  
  // 提取各字段（支持单引号和双引号）
  const extractField = (field) => {
    const m = block.match(new RegExp(`${field}:\\s*(?:'([^']*)'|"([^"]*)")`))
    return m ? (m[1] ?? m[2]) : null
  }
  
  const slug = extractField('slug')
  const curatorNote = extractField('curatorNote')
  const highlight = extractField('highlight')
  const tip = extractField('tip')
  
  if (!slug) return null
  
  return { date: today, slug, curatorNote, highlight, tip }
}

async function sendDailyEmail() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_API_KEY) {
    console.error('Missing environment variables')
    process.exit(1)
  }

  // 获取今日精选
  const feature = await getTodayFeature()
  if (!feature) {
    console.log('No daily feature for today')
    return
  }

  console.log(`Today's feature: ${feature.highlight}`)

  // 获取所有已确认的订阅者
  const subscribersResponse = await fetch(`${SUPABASE_URL}/rest/v1/subscribers?confirmed=eq.true&select=email`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  })

  const subscribers = await subscribersResponse.json()
  if (subscribers.length === 0) {
    console.log('No confirmed subscribers')
    return
  }

  console.log(`Sending to ${subscribers.length} subscribers...`)

  // 发送邮件
  const { Resend } = await import('resend')
  const resend = new Resend(RESEND_API_KEY)

  let sentCount = 0
  for (const subscriber of subscribers) {
    try {
      await resend.emails.send({
        from: 'CGfan <noreply@send.cgfan.com>',
        to: subscriber.email,
        subject: `每日一味：${feature.highlight}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2D5F3E; font-size: 24px; margin-bottom: 16px;">${feature.highlight}</h1>
            <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              ${feature.curatorNote}
            </p>
            ${feature.tip ? `
              <div style="background: #f0f9f4; border-left: 4px solid #2D5F3E; padding: 16px; margin-bottom: 24px;">
                <p style="color: #2D5F3E; font-size: 14px; margin: 0;">
                  <strong>💡 实用技巧</strong><br/>
                  ${feature.tip}
                </p>
              </div>
            ` : ''}
            <a href="https://www.cgfan.com/prompt/${feature.slug}" style="display: inline-block; background: #2D5F3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              查看完整提示词
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              退订请 <a href="https://www.cgfan.com/subscribe/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color: #999;">点击这里</a>
            </p>
          </div>
        `,
      })
      sentCount++
      console.log(`✓ Sent to ${subscriber.email}`)
    } catch (error) {
      console.error(`✗ Failed to send to ${subscriber.email}:`, error.message)
    }
  }

  // 记录发送日志
  await fetch(`${SUPABASE_URL}/rest/v1/daily_emails`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt_slug: feature.slug,
      recipient_count: sentCount
    })
  })

  console.log(`\n✅ Sent ${sentCount}/${subscribers.length} emails for "${feature.highlight}"`)
}

sendDailyEmail().catch(console.error)
