'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface DetailImageProps {
  src: string
  alt: string
  images?: string[]  // 多图支持
}

/**
 * 详情页图片区（客户端组件）
 * - 上方大图：保持现有样式，点击打开 Lightbox
 * - 下方缩略图条：水平滚动，点击切换大图
 * - Lightbox：全屏预览，支持左右切换
 */
export function DetailImage({ src, alt, images }: DetailImageProps) {
  // 如果有 images 数组，使用它；否则 fallback 到单张 src
  const imageList = images && images.length > 0 ? images : [src]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const thumbnailRef = useRef<HTMLDivElement>(null)

  const currentImage = imageList[currentIndex]
  const hasMultiple = imageList.length > 1

  // 按ESC键关闭 Lightbox
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

  // 切换图片时，自动滚动缩略图到可见区域
  useEffect(() => {
    if (thumbnailRef.current && hasMultiple) {
      const thumbnail = thumbnailRef.current.children[currentIndex] as HTMLElement
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex, hasMultiple])

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
        {/* 主图片区域 */}
        <div 
          className="cursor-zoom-in relative overflow-hidden rounded-xl"
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
          
          {/* 图片计数（仅多图时显示） */}
          {hasMultiple && (
            <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
              {currentIndex + 1} / {imageList.length}
            </div>
          )}
        </div>

        {/* 缩略图条（仅多图时显示） */}
        {hasMultiple && (
          <div 
            ref={thumbnailRef}
            className="mt-3 flex gap-2 overflow-x-auto px-3 pt-3 pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {imageList.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                  idx === currentIndex
                    ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ width: '72px', height: '72px' }}
                aria-label={`切换到第 ${idx + 1} 张图片`}
              >
                <Image
                  src={img}
                  alt={`${alt} - 图 ${idx + 1}`}
                  width={72}
                  height={72}
                  className="h-full w-full object-cover"
                  sizes="72px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox 全屏预览 */}
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
              {/* 左箭头 */}
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="上一张"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 右箭头 */}
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                aria-label="下一张"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* 图片计数 */}
              <div className="absolute top-4 right-16 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
                {currentIndex + 1} / {imageList.length}
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
          </div>
        </div>
      )}
    </>
  )
}
