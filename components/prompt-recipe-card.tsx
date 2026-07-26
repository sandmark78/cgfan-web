'use client'

import { useState, useRef, useEffect } from 'react'
import { PromptData } from '@/lib/prompts'
import { getCategoryLabel } from '@/lib/category-map'

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
      const H = 780
      canvas.width = W
      canvas.height = H

      // 背景 - 浅灰渐变
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#f1f5f9')
      bg.addColorStop(1, '#e2e8f0')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // 卡片主体 - 白色圆角卡片
      const cardX = 20
      const cardY = 20
      const cardW = W - 40
      const cardH = H - 40
      const cardRadius = 24

      // 卡片阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetY = 8
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius)
      ctx.fill()
      ctx.shadowColor = 'transparent'

      // 卡片边框（轻微）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.lineWidth = 1
      ctx.stroke()

      // 顶部绿色条 - 在卡片内部
      const headerY = cardY
      const headerH = 90
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius)
      ctx.clip()
      
      const headerGrad = ctx.createLinearGradient(cardX, headerY, cardX + cardW, headerY)
      headerGrad.addColorStop(0, '#22c55e')
      headerGrad.addColorStop(1, '#059669')
      ctx.fillStyle = headerGrad
      ctx.fillRect(cardX, headerY, cardW, headerH)

      // 标题 - 更大更醒目
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.textBaseline = 'middle'
      const title = prompt.title.length > 26 ? prompt.title.slice(0, 26) + '...' : prompt.title
      ctx.fillText(title, cardX + 24, headerY + 50)

      // "Prompt Card" 标签
      ctx.font = '12px -apple-system, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText('CGfan · Prompt Card', cardX + 24, headerY + 24)

      ctx.restore()

      // 示例图区域 - 在卡片内部，无圆角
      const imgY = cardY + headerH
      const imgH = 320
      
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius)
      ctx.clip()
      
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(cardX, imgY, cardW, imgH)
      
      if (imgRef.current) {
        try {
          // object-fit: cover 效果 - 等比例裁剪填充，无圆角
          const img = imgRef.current
          const imgRatio = img.width / img.height
          const targetRatio = cardW / imgH
          let sx, sy, sw, sh
          
          if (imgRatio > targetRatio) {
            // 图片更宽 → 裁剪左右
            sw = img.height * targetRatio
            sh = img.height
            sx = (img.width - sw) / 2
            sy = 0
          } else {
            // 图片更高 → 裁剪上下
            sw = img.width
            sh = img.width / targetRatio
            sx = 0
            sy = (img.height - sh) / 2
          }
          
          ctx.drawImage(img, sx, sy, sw, sh, cardX, imgY, cardW, imgH)
        } catch {
          // 图片绘制失败，留灰底
        }
      }
      
      ctx.restore()

      // 内容区
      const contentY = imgY + imgH + 20

      // 三列参数 - 更精致
      const params = [
        { label: '风格', value: getCategoryLabel(prompt.category) || '混合' },
        { label: '模型', value: prompt.model },
        { label: '难度', value: prompt.difficulty === 'beginner' ? '入门' : prompt.difficulty === 'intermediate' ? '进阶' : '高级' },
      ]

      const colW = 160
      const gap = 12
      const startX = cardX + 20
      params.forEach((p, i) => {
        const x = startX + i * (colW + gap)
        // 白色卡片背景
        ctx.fillStyle = '#f8fafc'
        ctx.beginPath()
        ctx.roundRect(x, contentY, colW, 56, 10)
        ctx.fill()
        
        // 轻微边框
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.stroke()

        // 标签
        ctx.fillStyle = '#64748b'
        ctx.font = '11px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.label, x + colW / 2, contentY + 20)

        // 值
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 14px -apple-system, sans-serif'
        ctx.fillText(p.value, x + colW / 2, contentY + 42)
      })

      // 关键原料
      const tagY = contentY + 76
      ctx.fillStyle = '#64748b'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('关键原料', cardX + 20, tagY)

      let tagX = cardX + 20
      const tagH = 26
      prompt.tags.slice(0, 4).forEach((tag) => {
        const tagWidth = ctx.measureText(tag).width + 20
        // 标签背景
        ctx.fillStyle = '#dcfce7'
        ctx.beginPath()
        ctx.roundRect(tagX, tagY + 10, tagWidth, tagH, 13)
        ctx.fill()

        // 标签文字
        ctx.fillStyle = '#166534'
        ctx.font = '12px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(tag, tagX + tagWidth / 2, tagY + 10 + tagH / 2 + 4)

        tagX += tagWidth + 10
      })

      // Prompt 预览
      const promptY = tagY + 60
      ctx.fillStyle = '#64748b'
      ctx.font = 'bold 11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Prompt 预览', cardX + 20, promptY)

      // 预览框背景
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.roundRect(cardX + 20, promptY + 12, cardW - 40, 65, 10)
      ctx.fill()
      
      // 预览框边框
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#475569'
      ctx.font = '12px -apple-system, sans-serif'
      const previewText = prompt.prompt.slice(0, 110).replace(/\n/g, ' ') + '...'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      // 文字换行
      const maxWidth = cardW - 60
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
        ctx.fillText(l, cardX + 32, promptY + 22 + i * 18)
      })

      // 底部水印 - 在卡片内部底部
      const footerY = cardY + cardH - 24
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText('www.cgfan.com', cardX + 20, footerY)

      ctx.textAlign = 'right'
      ctx.fillText(`❤️ ${prompt.likeCount || 0}`, cardX + cardW - 20, footerY)

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
      {/* 分享卡预览 */}
      <div
        id="recipe-card"
        className="mx-auto max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-2xl dark:from-gray-900 dark:to-gray-950"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium opacity-90">CGfan · Prompt Card</div>
              <div className="mt-1 truncate whitespace-nowrap text-lg font-bold">{prompt.title}</div>
            </div>
            <div className="flex-shrink-0 text-3xl">🎨</div>
          </div>
        </div>

        {/* 示例图 */}
        <div className="aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-800">
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
                {getCategoryLabel(prompt.category) || '混合'}
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