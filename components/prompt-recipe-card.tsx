'use client'

import { useState, useRef, useEffect } from 'react'
import { PromptData } from '@/lib/prompts'

interface PromptRecipeCardProps {
  prompt: PromptData
}

/**
 * Prompt 分享卡 - 可下载的精美分享卡片
 * 使用 Canvas API 原生绘制，避免 html2canvas 的 CORS 和兼容性问题
 */
export function PromptRecipeCard({ prompt }: PromptRecipeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  // 预加载图片
  useEffect(() => {
    if (!prompt.cover) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgRef.current = img }
    img.src = prompt.cover
  }, [prompt.cover])

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context not available')

      const W = 600
      const H = 800
      canvas.width = W
      canvas.height = H

      // 背景
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#f9fafb')
      bg.addColorStop(1, '#f3f4f6')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // 顶部绿色条
      const headerGrad = ctx.createLinearGradient(0, 0, W, 0)
      headerGrad.addColorStop(0, '#22c55e')
      headerGrad.addColorStop(1, '#059669')
      ctx.fillStyle = headerGrad
      ctx.fillRect(0, 0, W, 120)

      // 标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textBaseline = 'middle'
      const title = prompt.title.length > 28 ? prompt.title.slice(0, 28) + '...' : prompt.title
      ctx.fillText(title, 30, 60)

      // "Prompt Card" 标签
      ctx.font = '12px -apple-system, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillText('CGfan · Prompt Card', 30, 30)

      // 示例图区域
      const imgY = 120
      const imgH = 300
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(0, imgY, W, imgH)

      if (imgRef.current) {
        try {
          ctx.drawImage(imgRef.current, 0, imgY, W, imgH)
        } catch {
          // 图片绘制失败，留灰底
        }
      }

      // 内容区
      const contentY = imgY + imgH + 24

      // 三列参数
      const params = [
        { label: '风格', value: (prompt.tags[0] || '混合') },
        { label: '模型', value: prompt.model },
        { label: '难度', value: prompt.difficulty === 'beginner' ? '入门' : prompt.difficulty === 'intermediate' ? '进阶' : '高级' },
      ]

      const colW = 170
      const gap = 15
      const startX = 30
      params.forEach((p, i) => {
        const x = startX + i * (colW + gap)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(x, contentY, colW, 56, 8)
        ctx.fill()

        ctx.fillStyle = '#6b7280'
        ctx.font = '11px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.label, x + colW / 2, contentY + 22)

        ctx.fillStyle = '#111827'
        ctx.font = 'bold 13px -apple-system, sans-serif'
        ctx.fillText(p.value, x + colW / 2, contentY + 42)
      })

      // 关键原料
      const tagY = contentY + 80
      ctx.fillStyle = '#6b7280'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('关键原料', 30, tagY)

      let tagX = 30
      const tagH = 26
      prompt.tags.slice(0, 4).forEach((tag) => {
        ctx.fillStyle = '#dcfce7'
        ctx.beginPath()
        ctx.roundRect(tagX, tagY + 10, ctx.measureText(tag).width + 20, tagH, 13)
        ctx.fill()

        ctx.fillStyle = '#166534'
        ctx.font = '12px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(tag, tagX + (ctx.measureText(tag).width + 20) / 2, tagY + 10 + tagH / 2 + 4)

        tagX += ctx.measureText(tag).width + 28
      })

      // Prompt 预览
      const promptY = tagY + 60
      ctx.fillStyle = '#6b7280'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Prompt 预览', 30, promptY)

      ctx.fillStyle = '#f3f4f6'
      ctx.beginPath()
      ctx.roundRect(30, promptY + 12, W - 60, 60, 8)
      ctx.fill()

      ctx.fillStyle = '#374151'
      ctx.font = '12px -apple-system, sans-serif'
      const previewText = prompt.prompt.slice(0, 100).replace(/\n/g, ' ') + '...'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      // 文字换行
      const maxWidth = W - 80
      const lines = []
      let line = ''
      for (const char of previewText) {
        const testLine = line + char
        if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
          lines.push(line)
          line = char
        } else {
          line = testLine
        }
      }
      lines.push(line)

      lines.slice(0, 3).forEach((l, i) => {
        ctx.fillText(l, 44, promptY + 20 + i * 18)
      })

      // 底部水印
      ctx.fillStyle = '#9ca3af'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText('www.cgfan.com', 30, H - 24)

      ctx.textAlign = 'right'
      ctx.fillText(`❤️ ${prompt.likeCount || 0}`, W - 30, H - 24)

      // 下载
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Canvas toBlob failed'))
        }, 'image/png')
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `cgfan-${prompt.slug}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('生成卡片失败:', error)
      alert('下载失败，请稍后重试')
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
              <div className="text-xs font-medium opacity-90">CGfan · Prompt Card</div>
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
              crossOrigin="anonymous"
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
              <span>www.cgfan.com</span>
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
            下载 Prompt 卡片
          </>
        )}
      </button>
    </div>
  )
}