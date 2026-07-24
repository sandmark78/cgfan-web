'use client'

import { useState } from 'react'
import { PromptData } from '@/lib/prompts'

interface PromptRecipeCardProps {
  prompt: PromptData
}

/**
 * Prompt 食谱卡 - 可下载的精美分享卡片
 */
export function PromptRecipeCard({ prompt }: PromptRecipeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      // 动态导入 html2canvas
      const html2canvas = (await import('html2canvas')).default
      const cardElement = document.getElementById('recipe-card')
      
      if (!cardElement) return

      const canvas = await html2canvas(cardElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `cgfan-${prompt.slug}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('生成卡片失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 食谱卡预览 */}
      <div
        id="recipe-card"
        className="mx-auto max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl dark:from-gray-900 dark:to-gray-950"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium opacity-90">CGfan · Prompt Recipe</div>
              <div className="mt-1 text-lg font-bold">{prompt.title}</div>
            </div>
            <div className="text-3xl">🎨</div>
          </div>
        </div>

        {/* 示例图 */}
        <div className="aspect-video overflow-hidden bg-gray-200 dark:bg-gray-800">
          {prompt.cover ? (
            <img
              src={prompt.cover}
              alt={prompt.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">🎨</div>
          )}
        </div>

        {/* 内容区 */}
        <div className="p-6">
          {/* 关键参数 */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white p-3 text-center dark:bg-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">风格</div>
              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {prompt.tags.slice(0, 2).join(' · ') || '混合'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 text-center dark:bg-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">模型</div>
              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {prompt.model}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 text-center dark:bg-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">难度</div>
              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {prompt.difficulty === 'beginner' ? '入门' : prompt.difficulty === 'intermediate' ? '进阶' : '高级'}
              </div>
            </div>
          </div>

          {/* 关键原料 */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              关键原料
            </div>
            <div className="flex flex-wrap gap-2">
              {prompt.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 提示词预览 */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Prompt 预览
            </div>
            <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
              {prompt.prompt.slice(0, 150)}...
            </p>
          </div>

          {/* 底部水印 */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>cgfan-web.pages.dev</span>
              <span>❤️ {prompt.likeCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 下载按钮 */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="btn-primary mx-auto flex items-center gap-2 px-6 py-3 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            生成中...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载食谱卡
          </>
        )}
      </button>
    </div>
  )
}
