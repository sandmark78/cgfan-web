'use client'

import { useState } from 'react'
import { useToast } from '@/components/toast'

interface CopyPromptButtonProps {
  prompt: string
  label?: string
  className?: string
}

/**
 * 一键复制提示词按钮
 */
export function CopyPromptButton({ prompt, label = '复制提示词', className = '' }: CopyPromptButtonProps) {
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
      className={`daily-copy-btn ${className} ${copied ? 'copied' : ''}`}
      aria-label={copied ? '已复制' : label}
    >
      {copied ? '✓ 已复制' : label}
    </button>
  )
}