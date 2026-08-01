'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface DetailImageProps {
  src: string
  alt: string
}

/**
 * 详情页大图（客户端组件，处理图片加载失败和点击预览）
 */
export function DetailImage({ src, alt }: DetailImageProps) {
  const [hasError, setHasError] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  // 按ESC键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLightbox(false)
    }
    if (showLightbox) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showLightbox])

  // 阻止背景滚动
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showLightbox])

  if (hasError) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-900">
        <span className="text-6xl">🎨</span>
      </div>
    )
  }

  return (
    <div 
      className="relative overflow-hidden w-full h-[300px] max-w-[500px]"
    >
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
