import { TasteCard } from '@/components/taste-card'
import Link from 'next/link'

export const runtime = 'edge'

export const metadata = {
  title: '美学人格 | CGfan',
  description: '基于你的收藏，生成专属的美学人格卡片',
}

export default function TastePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-bold text-gray-900 dark:text-white">
          美学人格
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          收藏 5 个提示词，解锁专属于你的美学人格
        </p>
      </div>

      <TasteCard />

      <div className="mt-12 text-center">
        <Link href="/explore" className="btn-secondary inline-block">
          去逛逛 →
        </Link>
      </div>
    </div>
  )
}
