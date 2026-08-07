import { NextResponse } from 'next/server'
import { getAllFeatures } from '@/lib/daily-feature'
import { getPromptBySlug } from '@/lib/prompts'

export const runtime = 'edge'

export async function GET() {
  const features = getAllFeatures()
  const baseUrl = 'https://www.cgfan.com'

  const items = await Promise.all(features.map(async (f) => {
    const prompt = await getPromptBySlug(f.slug)
    const title = prompt?.title || f.slug
    const link = `${baseUrl}/prompt/${f.slug}`
    const date = new Date(f.date)
    const description = f.curatorNote + (f.tip ? `\n\n💡 ${f.tip}` : '')

    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${date.toUTCString()}</pubDate>
      <description><![CDATA[${description}]]></description>
      ${f.technique ? `<category>${f.technique}</category>` : ''}
    </item>`
  })).then(results => results.join('\n'))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CGfan 每日一味</title>
    <link>${baseUrl}</link>
    <description>每天一个精选 AI 提示词推荐，附策展笔记与实用技巧</description>
    <language>zh-cn</language>
    <atom:link href="${baseUrl}/daily/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}