'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface DetailImageProps {
  src: string
  alt: string
  images?: string[]  // 多图支持
}

/**
 * 详情页大图（客户端组件，支持多图轮播 + 点击预览）
 */
export function DetailImage({ src, alt, images }: DetailImageProps) {
  // 如果有 images 数组，使用它；否则 fallback 到单张 src
  const imageList = images && images.length > 0 ? images : [src]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)

  const currentImage = imageList[currentIndex]
  const hasMultiple = imageList.length > 1

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

  // 切换图片时重置错误状态
  useEffect(() => {
    setHasError(false)
  }, [currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))
  }

  if (hasError) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-zinc-900">
        <span className="text-6xl">🎨</span>
      </div>
    )
  }

  return (
    <>
      <div className="relative w-full max-w-[500px]">
        {/* 主图片 */}
        <div 
          className="cursor-zoom-in relative overflow-hidden"
          onClick={() => setShowLightbox(true)}
        >
          <Image
            src={currentImage}
            alt={alt}
            width={500}
            height={0}
            sizes="(max-width: 768px) 100vw, 500px"
            className="w-full h-auto object-contain transition-transform hover:scale-105"
            priority
            onError={() => setHasError(true)}
          />
        </div>

        {/* 多图指示器 */}
        {hasMultiple && (
          <>
            {/* 左右箭头 */}
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110"
              aria-label="上一张"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110"
              aria-label="下一张"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 底部圆点指示器 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {imageList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`切换到第 ${idx + 1} 张图片`}
                />
              ))}
            </div>

            {/* 图片计数 */}
            <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
              {currentIndex + 1} / {imageList.length}
            </div>
          </>
        )}
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

          {/* 多图导航（Lightbox 内） */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="上一张"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="下一张"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* 底部圆点指示器（Lightbox 内） */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {imageList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-white scale-125'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`切换到第 ${idx + 1} 张图片`}
                  />
                ))}
              </div>
            </>
          )}

          {/* 图片容器 */}
          <div 
            className="relative max-h-[90vh] max-w-4xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={alt}
              className="max-h-[90vh] max-w-full object-contain shadow-2xl"
            />
            {/* Lightbox 内图片计数 */}
            {hasMultiple && (
              <div className="absolute top-4 right-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
                {currentIndex + 1} / {imageList.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}