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
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...prompts.map((prompt) => ({
      url: `${baseUrl}/prompt/${prompt.slug}`,
      lastModified: new Date(prompt.date),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
