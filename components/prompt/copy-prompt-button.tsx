'use client'

import { useState } from 'react'

interface CopyPromptButtonProps {
  prompt: string
  label?: string
}

/**
 * 一键复制提示词按钮
 */
export function CopyPromptButton({ prompt, label = '复制提示词' }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`btn-primary w-full ${copied ? 'copied' : ''}`}
    >
      {copied ? '✓ 已复制' : label}
    </button>
  )
}
