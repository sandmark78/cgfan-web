import Link from 'next/link'

export const runtime = 'edge'

/**
 * English Home Page - no data dependency
 */
export default function EnglishHome() {
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
    </div>
  )
}
