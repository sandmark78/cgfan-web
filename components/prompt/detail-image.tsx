'use client'

import { useState } from 'react'

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
    <div className="relative overflow-hidden rounded-xl w-full">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover"
        style={{ maxHeight: '300px', maxWidth: '500px' }}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
