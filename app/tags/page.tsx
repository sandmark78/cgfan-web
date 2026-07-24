import { getAllTags } from '@/lib/prompts'
import Link from 'next/link'

export const runtime = 'edge'

export const metadata = {
  title: '标签 | CGfan',
  description: '浏览所有 AI 提示词标签，按主题分类查找你感兴趣的 prompt。',
}

export default function TagsPage() {
  const tags = getAllTags()

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          标签
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          共 {tags.length} 个标签，点击标签查看相关提示词
        </p>

        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/explore?tag=${encodeURIComponent(tag.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-green-500 dark:hover:border-green-500 transition-colors group"
            >
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                #{tag.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {tag.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
