import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { CandidateImage } from './candidate-image'

interface Candidate {
  id: number
  tweet_id: string
  title: string
  prompt: string
  prompt_full: string
  model: string
  category: string
  cover: string
  source: string
  author: string
  scores: Record<string, number>
  total_score: number
  date: string
  added: string
}

interface DayBatch {
  date: string
  candidates: Candidate[]
}

export default function CandidatesPage() {
  const candidatesDir = join(process.cwd(), 'content/candidates')
  let batches: DayBatch[] = []

  if (existsSync(candidatesDir)) {
    const files = readdirSync(candidatesDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()

    for (const file of files) {
      const date = file.replace('.json', '')
      const content = readFileSync(join(candidatesDir, file), 'utf-8')
      const candidates = JSON.parse(content) as Candidate[]
      batches.push({ date, candidates })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 55) return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
  }

  const totalCandidates = batches.reduce((sum, b) => sum + b.candidates.length, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
          📋 候选提示词
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          共 {totalCandidates} 条待筛选 · 看上告诉我编号
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="py-24 text-center text-gray-500 dark:text-gray-400">
          <div className="mb-4 text-6xl">📭</div>
          <p>暂无候选内容，等待下次采集...</p>
        </div>
      ) : (
        batches.map((batch) => (
          <div key={batch.date} className="mb-12">
            <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-gray-200">
              📅 {batch.date}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {batch.candidates.length} 条
              </span>
            </h2>

            <div className="space-y-4">
              {batch.candidates.map((c) => (
                <div
                  key={c.tweet_id}
                  className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                  id={`candidate-${c.id}`}
                >
                  {/* 编号 */}
                  <div className="flex w-10 flex-shrink-0 items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                      {c.id}
                    </span>
                  </div>

                  {/* 图片 */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <CandidateImage cover={c.cover} title={c.title} />
                  </div>

                  {/* 内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {c.title}
                      </h3>
                      <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {c.model}
                      </span>
                    </div>

                    <p className="mb-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                      {c.prompt}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${getScoreColor(c.total_score)}`}>
                        {c.total_score}/80
                      </span>
                      <span>#{c.category}</span>
                      <span>@{c.author}</span>
                      <a
                        href={c.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline dark:text-green-400"
                      >
                        原文 ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}