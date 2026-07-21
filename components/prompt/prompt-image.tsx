'use client'

import { useState } from 'react'

interface PromptImageProps {
  src: string
  alt: string
}

/**
 * 提示词封面图（客户端组件，处理图片加载失败）
 */
export function PromptImage({ src, alt }: PromptImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
        <span className="text-4xl">🎨</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setHasError(true)}
    />
  )
}
