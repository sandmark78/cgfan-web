'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PromptImageProps {
  src: string
  alt: string
  priority?: boolean
}

/**
 * 提示词封面图（客户端组件，处理图片加载失败）
 */
export function PromptImage({ src, alt, priority = false }: PromptImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
        <span className="text-4xl">🎨</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      priority={priority}
      onError={() => setHasError(true)}
    />
  )
}
