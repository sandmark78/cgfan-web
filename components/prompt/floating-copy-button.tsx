'use client'

import { useState } from 'react'
import { useToast } from '@/components/toast'

interface FloatingCopyButtonProps {
  prompt: string
}

/**
 * 移动端浮动复制按钮 - 固定在右下角
 */
export function FloatingCopyButton({ prompt }: FloatingCopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { show } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      show('提示词已复制', '✓')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
      show('复制失败，请重试', '✕')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl lg:hidden"
      aria-label="复制提示词"
    >
      {copied ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}
