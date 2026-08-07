import Link from 'next/link'

export const runtime = 'edge'

/**
 * English Explore Page - Simple placeholder
 */
export default function EnglishExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center py-24">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Explore Prompts
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          English version coming soon. Please use the Chinese version for now.
        </p>
        <Link href="/explore" className="btn-primary inline-block">
          Go to Chinese Version →
        </Link>
      </div>
    </div>
  )
}
