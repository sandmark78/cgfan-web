import { getAllPrompts } from '@/lib/prompts'

export default function sitemap() {
  const prompts = getAllPrompts()
  const baseUrl = 'https://cgfan-web.pages.dev'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...prompts.map((prompt) => ({
      url: `${baseUrl}/prompt/${prompt.slug}`,
      lastModified: new Date(prompt.date),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
