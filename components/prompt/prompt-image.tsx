'use client'

import { useState } from 'react'
import Image from 'next/image'

interface PromptImageProps {
  src: string
  alt: string
  priority?: boolean
}

/**
 * 提示词封面图（客户端组件，处理图片加载失败 + 模糊占位）
 */
export function PromptImage({ src, alt, priority = false }: PromptImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800">
        <span className="text-4xl">🎨</span>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-lg" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`object-cover transition-transform duration-300 group-hover:scale-105 transition-opacity duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        priority={priority}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
