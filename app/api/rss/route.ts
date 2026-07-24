import { getAllPrompts } from '@/lib/prompts'

export const runtime = 'edge'

/**
 * RSS Feed - 提供 RSS 输出
 * GET /api/rss
 */
export async function GET() {
  const prompts = getAllPrompts().slice(0, 50) // 最新 50 条
  const baseUrl = 'https://cgfan-web.pages.dev'

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CGfan - AI 提示词画廊</title>
    <link>${baseUrl}</link>
    <description>每日精选 AI 提示词和示例图</description>
    <language>zh-CN</language>
    <ttl>1440</ttl>
    ${prompts
      .map(
        (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${baseUrl}/prompt/${p.slug}</link>
      <description>${escapeXml(p.prompt.slice(0, 300))}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/prompt/${p.slug}</guid>
    </item>`
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
