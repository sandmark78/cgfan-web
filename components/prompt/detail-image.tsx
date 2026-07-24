'use client'

import { useState } from 'react'
import Image from 'next/image'

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
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={1200}
      sizes="(max-width: 768px) 100vw, 1200px"
      className="w-full object-cover"
      priority
      onError={() => setHasError(true)}
    />
  )
}
