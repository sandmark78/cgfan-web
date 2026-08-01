'use client'

import { useState } from 'react'
import Image from 'next/image'

export function CandidateImage({ cover, title }: { cover: string; title: string }) {
  const [imgError, setImgError] = useState(false)

  if (!cover || imgError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
        <span className="text-2xl">🎨</span>
      </div>
    )
  }

  return (
    <Image
      src={cover}
      alt={title}
      fill
      className="object-cover"
      sizes="96px"
      unoptimized
      onError={() => setImgError(true)}
    />
  )
}