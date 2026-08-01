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
    <>
      <div 
        className="cursor-zoom-in relative overflow-hidden w-full aspect-[4/3] max-h-[60vh]"
        onClick={() => setShowLightbox(true)}
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

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="关闭"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 图片容器 */}
          <div 
            className="relative max-h-[90vh] max-w-[90vw] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}
