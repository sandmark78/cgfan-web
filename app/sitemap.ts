import { getAllPrompts } from '@/lib/prompts'

export default async function sitemap() {
  const prompts = await getAllPrompts()
  const baseUrl = 'https://www.cgfan.com'

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
    ...prompts.map((prompt) => {
      let lastMod = new Date()
      if (prompt.date) {
        const d = new Date(prompt.date)
        if (!isNaN(d.getTime())) {
          lastMod = d
        }
      }
      return {
        url: `${baseUrl}/prompt/${prompt.slug}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    }),
  ]
}
