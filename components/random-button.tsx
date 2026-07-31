'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RandomButtonProps {
  slugs: string[]
}

export function RandomButton({ slugs }: RandomButtonProps) {
  const router = useRouter()
  const [spinning, setSpinning] = useState(false)

  const handleClick = () => {
    setSpinning(true)
    const slug = slugs[Math.floor(Math.random() * slugs.length)]
    // 短暂延迟模拟"抽选"感
    setTimeout(() => {
      router.push(`/prompt/${slug}`)
    }, 300)
  }

  return (
    <button
      onClick={handleClick}
      disabled={spinning}
      aria-label="随机选择一个提示词"
      className="inline-flex items-center gap-1.5 rounded-full border border-green-200/50 px-3 py-1.5 text-xs font-medium text-green-600 transition-all hover:bg-green-50/50 hover:border-green-300/60 disabled:opacity-50 dark:border-green-700/40 dark:text-green-400 dark:hover:bg-green-900/20"
    >
      <span className={`transition-transform duration-300 ${spinning ? 'rotate-180' : ''}`}>
        🎲
      </span>
      随机一个
    </button>
  )
}