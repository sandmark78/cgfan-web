import Link from 'next/link'
import { getAllPrompts } from '@/lib/prompts'

export const runtime = 'edge'

/**
 * English Home Page - Simplified version
 */
export default async function EnglishHome() {
  const prompts = getAllPrompts()
  const latestPrompts = prompts.slice(-8).reverse()

  return (
    <div className="py-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl leading-tight">
          Daily Pick · One Prompt, One Image
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-600 dark:text-gray-400">
          Curated AI prompts with examples and notes. Quality over quantity, ready to use.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/en/explore" className="btn-primary">
            Browse All
          </Link>
        </div>
      </div>

      {/* Latest Prompts */}
      <div className="mt-12">
        <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-6">
          Latest Prompts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestPrompts.map((prompt) => (
            <Link
              key={prompt.slug}
              href={`/en/prompt/${prompt.slug}`}
              className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-green-500 transition-colors"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prompt.cover}
                  alt={prompt.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                  {prompt.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {prompt.model}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
