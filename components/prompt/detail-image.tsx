'use client'

import { useState } from 'react'

interface DetailImageProps {
  src: string
  alt: string
}

/**
 * 详情页大图（客户端组件，处理图片加载失败）
 */
export function DetailImage({ src, alt }: DetailImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-900">
        <span className="text-6xl">🎨</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full object-cover"
      onError={() => setHasError(true)}
    />
  )
}
