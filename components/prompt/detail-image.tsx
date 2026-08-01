'use client'

import { useState } from 'react'
import Image from 'next/image'

interface DetailImageProps {
  src: string
  alt: string
}

/**
 * 详情页大图
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
    <div className="relative overflow-hidden w-full h-[300px] max-w-[500px]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        className="object-cover transition-transform hover:scale-105"
        priority
        onError={() => setHasError(true)}
      />
    </div>
  )
}
