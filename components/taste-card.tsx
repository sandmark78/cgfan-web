'use client'

import { useState, useEffect, useRef } from 'react'
import { UserProfile, loadProfile, saveProfile, clearProfile, getGrowthStage, GROWTH_STAGES } from '@/lib/aesthetic-dynamic'
import { BASE_PERSONAS, BasePersona, AestheticVector } from '@/lib/aesthetic-engine'
import { AestheticQuiz } from './aesthetic-quiz'
import { Puzzle, Palette, Heart, Waves, Star, Scale, ScrollText, Paintbrush, Download } from 'lucide-react'

interface TasteCardClientProps {
  serverFavorites?: Array<{ slug: string; title: string; category: string; tags: string[]; model: string; cover: string }>
  isLoggedIn?: boolean
}

// 维度图标映射（使用 lucide-react 图标）
const DIMENSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  complexity: Puzzle,
  colorIntensity: Palette,
  arousal: Heart,
  fluency: Waves,
  novelty: Star,
  harmony: Scale,
  narrative: ScrollText,
  stylization: Paintbrush,
}

// 从提示词计算8维向量
function calculateVectorFromPrompt(prompt: { category: string; tags: string[] }): AestheticVector {
  const vector: AestheticVector = {
    complexity: 50,
    colorIntensity: 50,
    arousal: 50,
    fluency: 50,
    novelty: 50,
    harmony: 50,
    narrative: 50,
    stylization: 50,
  }

  switch (prompt.category) {
    case 'photography':
      vector.narrative += 25; vector.colorIntensity += 15; vector.fluency += 10; break
    case 'photorealistic':
      vector.fluency += 30; vector.narrative += 20; vector.stylization -= 20; break
    case '3d':
      vector.complexity += 25; vector.stylization += 20; vector.novelty += 15; break
    case 'poster':
      vector.colorIntensity += 20; vector.novelty += 15; vector.complexity += 10; break
    case 'portrait':
      vector.narrative += 20; vector.arousal += 15; vector.fluency += 10; break
    case 'product':
      vector.fluency += 20; vector.complexity += 10; vector.harmony += 15; break
    case 'illustration':
      vector.stylization += 25; vector.novelty += 20; vector.colorIntensity += 15; break
    case 'anime':
      vector.stylization += 30; vector.novelty += 25; vector.colorIntensity += 20; break
    case 'retro':
      vector.novelty -= 15; vector.narrative += 20; vector.harmony += 15; break
    case 'minimalist':
      vector.complexity -= 25; vector.fluency += 30; vector.harmony += 20; break
    case 'sci-fi':
      vector.novelty += 30; vector.stylization += 25; vector.arousal += 20; break
    case 'fantasy':
      vector.novelty += 25; vector.stylization += 20; vector.arousal += 15; break
    case 'landscape':
      vector.harmony += 25; vector.narrative += 15; vector.fluency += 10; break
    case 'concept-art':
      vector.novelty += 30; vector.stylization += 25; vector.complexity += 15; break
  }

  const tags = prompt.tags.map(t => t.toLowerCase())
  const tagStr = tags.join(' ')
  
  if (tagStr.includes('极简') || tagStr.includes('minimal') || tagStr.includes('简约') || tagStr.includes('留白')) {
    vector.complexity -= 25; vector.fluency += 30; vector.harmony += 20
  }
  if (tagStr.includes('赛博') || tagStr.includes('cyber') || tagStr.includes('科幻') || tagStr.includes('sci-fi')) {
    vector.colorIntensity += 25; vector.novelty += 20; vector.stylization += 25; vector.arousal += 15
  }
  if (tagStr.includes('东方') || tagStr.includes('eastern') || tagStr.includes('中国') || tagStr.includes('水墨') || tagStr.includes('古风')) {
    vector.harmony += 25; vector.narrative += 20; vector.fluency += 15; vector.stylization += 10
  }
  if (tagStr.includes('复古') || tagStr.includes('retro') || tagStr.includes('怀旧') || tagStr.includes('vintage')) {
    vector.novelty -= 15; vector.narrative += 20; vector.stylization += 15; vector.harmony += 10
  }
  if (tagStr.includes('电影') || tagStr.includes('cinematic') || tagStr.includes('叙事') || tagStr.includes('故事')) {
    vector.narrative += 30; vector.arousal += 20; vector.colorIntensity += 15
  }
  if (tagStr.includes('3d') || tagStr.includes('渲染') || tagStr.includes('render') || tagStr.includes('blender')) {
    vector.complexity += 25; vector.stylization += 20; vector.novelty += 15
  }
  if (tagStr.includes('摄影') || tagStr.includes('photography') || tagStr.includes('写实') || tagStr.includes('realistic')) {
    vector.fluency += 25; vector.narrative += 15; vector.stylization -= 15
  }
  if (tagStr.includes('抽象') || tagStr.includes('abstract') || tagStr.includes('艺术') || tagStr.includes('art')) {
    vector.novelty += 25; vector.stylization += 20; vector.complexity += 10
  }
  if (tagStr.includes('动漫') || tagStr.includes('anime') || tagStr.includes('二次元') || tagStr.includes('manga')) {
    vector.stylization += 30; vector.novelty += 25; vector.colorIntensity += 20
  }
  if (tagStr.includes('奇幻') || tagStr.includes('fantasy') || tagStr.includes('魔幻') || tagStr.includes('神话')) {
    vector.novelty += 25; vector.stylization += 20; vector.arousal += 15
  }
  if (tagStr.includes('微缩') || tagStr.includes('miniature') || tagStr.includes('细节') || tagStr.includes('detail')) {
    vector.complexity += 30; vector.novelty += 20; vector.fluency += 10
  }

  Object.keys(vector).forEach(key => {
    const k = key as keyof AestheticVector
    vector[k] = Math.max(0, Math.min(100, vector[k]))
  })

  return vector
}

// 雷达图组件
function RadarChart({ vector, size = 280, dimensions }: { 
  vector: AestheticVector
  size?: number
  dimensions: readonly { key: string; label: string }[]
}) {
  const center = size / 2
  const maxRadius = size * 0.35
  const labelRadius = size * 0.48
  
  // 8个维度均匀分布在360度
  const angleStep = 360 / dimensions.length
  
  const getPoint = (angle: number, value: number) => {
    const rad = (angle * Math.PI) / 180
    const distance = (value / 100) * maxRadius
    return { x: center + distance * Math.cos(rad), y: center + distance * Math.sin(rad) }
  }

  const getLabelPoint = (angle: number) => {
    const rad = (angle * Math.PI) / 180
    return { x: center + labelRadius * Math.cos(rad), y: center + labelRadius * Math.sin(rad) }
  }

  // 生成直线路径（不使用贝塞尔曲线）
  const dataPoints = dimensions.map((d, i) => {
    const angle = -90 + i * angleStep
    return getPoint(angle, vector[d.key as keyof AestheticVector])
  })
  
  // 使用直线连接
  let path = `M ${dataPoints[0].x} ${dataPoints[0].y}`
  for (let i = 1; i < dataPoints.length; i++) {
    path += ` L ${dataPoints[i].x} ${dataPoints[i].y}`
  }
  path += ' Z'

  // 显示所有8个维度标签
  const visibleDimensions = dimensions

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        
        {/* 背景网格 */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon
            key={i}
            points={dimensions.map((_, idx) => {
              const angle = -90 + idx * angleStep
              const p = getPoint(angle, scale * 100)
              return `${p.x},${p.y}`
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth={0.5}
            opacity={0.2 + i * 0.1}
          />
        ))}
        
        {/* 辐射线 */}
        {dimensions.map((_, i) => {
          const angle = -90 + i * angleStep
          const p = getPoint(angle, 100)
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#10b981" strokeWidth={0.5} opacity={0.3} />
        })}
        
        {/* 数据区域（直线连接） */}
        <path d={path} fill="url(#radarFill)" stroke="#10b981" strokeWidth={2} />
        
        {/* 数据点 */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#10b981" />
        ))}
      </svg>
      
      {/* 只显示顶部和底部的维度标签 */}
      {visibleDimensions.map((dim) => {
        const i = dimensions.findIndex(d => d.key === dim.key)
        const angle = -90 + i * angleStep
        const labelPoint = getLabelPoint(angle)
        const value = Math.round(vector[dim.key as keyof AestheticVector])
        
        return (
          <div
            key={dim.key}
            className="absolute flex flex-col items-center gap-0.5"
            style={{
              left: labelPoint.x,
              top: labelPoint.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{dim.label}</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{value}</div>
          </div>
        )
      })}
    </div>
  )
}

// 成长曲线组件
function GrowthCurve({ history }: { history: Array<{ slug: string; vector: AestheticVector; timestamp: number }> }) {
  if (history.length < 2) return null
  
  const padding = { top: 15, right: 15, bottom: 25, left: 35 }
  const width = 600
  const height = 140
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  const xScale = (i: number) => padding.left + (i / (history.length - 1)) * chartWidth
  const yScale = (v: number) => padding.top + chartHeight - (v / 100) * chartHeight
  
  // 计算平均值
  const avgData = history.map(h => {
    const values = Object.values(h.vector)
    return values.reduce((a, b) => a + b, 0) / values.length
  })
  
  // 生成平滑路径
  const points = avgData.map((v, i) => ({ x: xScale(i), y: yScale(v) }))
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    const cp1x = prev.x + (curr.x - prev.x) / 3
    const cp1y = prev.y + (curr.y - prev.y) / 3
    const cp2x = curr.x - (next ? (next.x - prev.x) / 6 : (curr.x - prev.x) / 3)
    const cp2y = curr.y - (next ? (next.y - prev.y) / 6 : (curr.y - prev.y) / 3)
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
  }
  
  const areaPath = `${path} L ${points[points.length - 1].x} ${yScale(0)} L ${points[0].x} ${yScale(0)} Z`

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">审美成长曲线</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">{history.length} 次收藏</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* 网格线 */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={padding.left} y1={yScale(v)} x2={width - padding.right} y2={yScale(v)} stroke="#10b981" strokeWidth={0.5} opacity={0.15} />
            <text x={padding.left - 5} y={yScale(v)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400" fontSize={10}>{v}</text>
          </g>
        ))}
        
        {/* 面积填充 */}
        <path d={areaPath} fill="url(#curveGradient)" />
        
        {/* 曲线 */}
        <path d={path} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />
        
        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2} fill="#10b981" />
            {i === points.length - 1 && (
              <text x={p.x + 8} y={p.y - 8} className="fill-emerald-600" fontSize={10} fontWeight="bold">新纪录</text>
            )}
          </g>
        ))}
        
        {/* X轴标签 */}
        {history.map((_, i) => {
          if (i % Math.ceil(history.length / 8) !== 0 && i !== history.length - 1) return null
          return <text key={i} x={xScale(i)} y={height - 5} textAnchor="middle" className="fill-gray-400" fontSize={10}>{i + 1}</text>
        })}
      </svg>
    </div>
  )
}

export function TasteCardClient({ serverFavorites, isLoggedIn }: TasteCardClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentPersona, setCurrentPersona] = useState<BasePersona | null>(null)
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const saved = loadProfile()
    let hasChanges = false
    
    if (serverFavorites && serverFavorites.length > 0) {
      saved.favoriteCount = serverFavorites.length
      const existingSlugs = new Set(saved.history.map(h => h.slug))
      const newFavorites = serverFavorites.filter(fav => !existingSlugs.has(fav.slug))
      
      if (newFavorites.length > 0 || saved.history.length === 0) {
        saved.history = [...saved.history, ...newFavorites.map((fav, index) => ({
          slug: fav.slug,
          vector: calculateVectorFromPrompt(fav),
          timestamp: Date.now() - (newFavorites.length - index) * 1000,
        }))]
        hasChanges = true
      }
      
      if (saved.history.length > 0) {
        const avgVector: AestheticVector = { complexity: 0, colorIntensity: 0, arousal: 0, fluency: 0, novelty: 0, harmony: 0, narrative: 0, stylization: 0 }
        saved.history.forEach(item => {
          (Object.keys(avgVector) as (keyof AestheticVector)[]).forEach(key => {
            avgVector[key] += item.vector[key]
          })
        })
        ;(Object.keys(avgVector) as (keyof AestheticVector)[]).forEach(key => {
          avgVector[key] = Math.round(avgVector[key] / saved.history.length)
        })
        saved.vector = avgVector
        hasChanges = true
      }
      
      if (hasChanges) saveProfile(saved)
    } else {
      const localFavs = JSON.parse(localStorage.getItem('cgfan_favorites') || '[]')
      if (localFavs.length > 0) {
        saved.favoriteCount = localFavs.length
        const existingSlugs = new Set(saved.history.map(h => h.slug))
        const newFavorites = localFavs.filter((fav: any) => !existingSlugs.has(fav.slug))
        
        if (newFavorites.length > 0 || saved.history.length === 0) {
          saved.history = [...saved.history, ...newFavorites.map((fav: any, index: number) => ({
            slug: fav.slug,
            vector: calculateVectorFromPrompt(fav),
            timestamp: Date.now() - (newFavorites.length - index) * 1000,
          }))]
          hasChanges = true
        }
        
        if (saved.history.length > 0) {
          const avgVector: AestheticVector = { complexity: 0, colorIntensity: 0, arousal: 0, fluency: 0, novelty: 0, harmony: 0, narrative: 0, stylization: 0 }
          saved.history.forEach(item => {
            (Object.keys(avgVector) as (keyof AestheticVector)[]).forEach(key => {
              avgVector[key] += item.vector[key]
            })
          })
          ;(Object.keys(avgVector) as (keyof AestheticVector)[]).forEach(key => {
            avgVector[key] = Math.round(avgVector[key] / saved.history.length)
          })
          saved.vector = avgVector
          hasChanges = true
        }
        
        if (hasChanges) saveProfile(saved)
      }
    }
    
    setProfile(saved)
    if (saved.currentPersonaId) {
      const persona = BASE_PERSONAS.find(p => p.id === saved.currentPersonaId)
      setCurrentPersona(persona || null)
    }
  }, [serverFavorites, refreshKey])

  const handleRetake = () => {
    clearProfile()
    localStorage.removeItem('cgfan_quiz_result')
    setProfile(null)
    setCurrentPersona(null)
    setShowRetakeConfirm(false)
    setShowQuiz(true)
  }

  const handleDownloadCard = async () => {
    if (!profile || !currentPersona) return
    setIsGenerating(true)
    
    try {
      const canvas = document.createElement('canvas')
      const dpr = window.devicePixelRatio || 2
      const W = 533
      const H = 800
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')
      
      ctx.scale(dpr, dpr)
      
      // 配色
      const C = {
        bgTop: '#F7FBF5',
        bgBot: '#E0ECD6',
        ink: '#3D8C5A',
        inkDeep: '#2A6B3F',
        soft: '#7A9E7A',
        soft2: '#9AB89A',
        track: 'rgba(61,140,90,.12)',
        line: 'rgba(61,140,90,.22)',
        lineSoft: 'rgba(61,140,90,.12)',
        pill: '#3D8C5A',
        pillInk: '#F7FBF5',
        spectrum: ['#2A6B3F', '#3D8C5A', '#5DAD6A', '#7FC08A', '#A8D4A8', '#C8E4C8'],
      }
      
      // 背景渐变
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, C.bgTop)
      bg.addColorStop(1, C.bgBot)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      
      // 左上窗光效果
      const windowLight = ctx.createRadialGradient(120, 90, 10, 320, 200, 400)
      windowLight.addColorStop(0, 'rgba(255,255,255,0.15)')
      windowLight.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = windowLight
      ctx.fillRect(0, 0, W, H)
      
      // 双线内框
      ctx.strokeStyle = C.line
      ctx.lineWidth = 1
      ctx.strokeRect(24, 24, W - 48, H - 48)
      ctx.strokeStyle = C.lineSoft
      ctx.strokeRect(28, 28, W - 56, H - 56)
      
      // 左侧竖线强调
      const LX = 41
      ctx.fillStyle = C.ink
      ctx.fillRect(LX, 56, 3, 155)
      
      // 顶部双行标题
      ctx.font = `700 11px -apple-system, "PingFang SC", sans-serif`
      ctx.fillStyle = C.ink
      ctx.textAlign = 'left'
      ctx.fillText('CGfan · Aesthetic Persona', LX, 56)
      
      // 编号
      const serialNum = ((profile.favoriteCount * 137 + currentPersona.name.length * 911) % 9000 + 1000).toString()
      ctx.font = `600 10px -apple-system, sans-serif`
      ctx.fillStyle = C.soft2
      ctx.textAlign = 'right'
      ctx.fillText(`No.${serialNum}`, W - 39, 56)
      
      // "你是"
      const nameY = 131
      ctx.font = `500 14px "Noto Serif SC", serif`
      ctx.fillStyle = C.soft
      ctx.textAlign = 'left'
      ctx.fillText('你是', LX, nameY)
      
      // 人格名
      const nameSize = currentPersona.name.length >= 6 ? 40 : currentPersona.name.length === 5 ? 48 : 56
      ctx.font = `900 ${nameSize}px "Noto Serif SC", serif`
      ctx.fillStyle = C.ink
      ctx.fillText(currentPersona.name, LX, nameY + 64)
      
      // 英文名
      ctx.font = `600 10px -apple-system, sans-serif`
      ctx.fillStyle = C.soft2
      ctx.fillText(currentPersona.en.toUpperCase(), LX, nameY + 91)
      
      // 描述（换行）
      const descY = nameY + 129
      ctx.font = `500 14px "Noto Serif SC", serif`
      ctx.fillStyle = C.soft
      
      // 简单的文字换行
      const maxWidth = W - LX - 39
      const words = currentPersona.description.split('')
      let line = ''
      let lineY = descY
      const lineSpacing = 20
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i]
        if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
          ctx.fillText(line, LX, lineY)
          line = words[i]
          lineY += lineSpacing
          if (lineY > descY + lineSpacing * 2) break // 最多3行
        } else {
          line = testLine
        }
      }
      if (line && lineY <= descY + lineSpacing * 2) {
        ctx.fillText(line, LX, lineY)
      }
      
      // 装饰短线+菱形
      const decoY = descY + lineSpacing * 3 + 20
      ctx.strokeStyle = C.lineSoft
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(LX, decoY)
      ctx.lineTo(LX + 40, decoY)
      ctx.stroke()
      
      ctx.fillStyle = C.ink
      ctx.beginPath()
      ctx.moveTo(LX + 50, decoY)
      ctx.lineTo(LX + 55, decoY - 4)
      ctx.lineTo(LX + 60, decoY)
      ctx.lineTo(LX + 55, decoY + 4)
      ctx.closePath()
      ctx.fill()
      
      // 品味光谱标题
      const spectrumTitleY = decoY + 35
      ctx.font = `bold 11px -apple-system, sans-serif`
      ctx.fillStyle = C.ink
      ctx.textAlign = 'left'
      ctx.fillText('品味光谱', LX, spectrumTitleY)
      
      // 三条光谱条
      const barStartY = spectrumTitleY + 23
      const barW = 266
      const barH = 8
      const barGap = 28
      
      for (let i = 0; i < 3; i++) {
        const y = barStartY + i * barGap
        // 轨道底
        ctx.fillStyle = C.track
        ctx.beginPath()
        ctx.roundRect(LX, y, barW, barH, 4)
        ctx.fill()
        
        // 渐变条
        const grad = ctx.createLinearGradient(LX, y, LX + barW, y)
        C.spectrum.forEach((color, idx) => {
          grad.addColorStop(idx / (C.spectrum.length - 1), color)
        })
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(LX, y, barW * (0.4 + i * 0.2), barH, 4)
        ctx.fill()
      }
      
      // 标签胶囊
      const tagY = barStartY + 3 * barGap + 30
      const tags = [stage.name, currentPersona.name, `${profile.favoriteCount} 收藏`]
      let tagX = LX
      
      tags.forEach((tag) => {
        ctx.font = `500 11px -apple-system, sans-serif`
        const tagWidth = ctx.measureText(tag).width + 24
        ctx.fillStyle = C.pill
        ctx.beginPath()
        ctx.roundRect(tagX, tagY, tagWidth, 24, 12)
        ctx.fill()
        
        ctx.fillStyle = C.pillInk
        ctx.textAlign = 'center'
        ctx.fillText(tag, tagX + tagWidth / 2, tagY + 16)
        tagX += tagWidth + 10
      })
      
      // 圆火漆章
      const sealX = W - 76
      const sealY = tagY + 80
      const sealR = 36
      
      // 外圈波浪
      ctx.strokeStyle = C.inkDeep
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const wave = Math.sin(a * 8) * 3.5
        const r = sealR + 2 + wave
        const x = sealX + Math.cos(a) * r
        const y = sealY + Math.sin(a) * r
        if (a === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      
      // 内圈
      ctx.strokeStyle = C.line
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(sealX, sealY, sealR - 8, 0, Math.PI * 2)
      ctx.stroke()
      
      // 竖排文字
      ctx.fillStyle = C.inkDeep
      ctx.font = `900 20px "Noto Serif SC", serif`
      ctx.textAlign = 'center'
      const sealText = '美学'
      sealText.split('').forEach((ch, i) => {
        ctx.fillText(ch, sealX, sealY + (i - 0.5) * 22)
      })
      
      // 底部 meta
      const metaY = H - 60
      ctx.fillStyle = C.soft2
      ctx.font = `10px -apple-system, sans-serif`
      ctx.textAlign = 'left'
      const date = new Date().toLocaleDateString('zh-CN')
      ctx.fillText(date, LX, metaY)
      ctx.fillText('www.cgfan.com', LX, metaY + 15)
      
      // 下载
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('生成失败，请重试')
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cgfan-aesthetic-${currentPersona.id}.png`
        a.click()
        URL.revokeObjectURL(url)
        setIsGenerating(false)
      }, 'image/png')
    } catch (error) {
      console.error('生成卡片失败:', error)
      alert('生成失败，请重试')
      setIsGenerating(false)
    }
  }

  if (showQuiz || !profile || !currentPersona) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <AestheticQuiz />
      </div>
    )
  }

  const stage = getGrowthStage(profile.favoriteCount)
  const dimensions = [
    { key: 'complexity', label: '复杂度' },
    { key: 'colorIntensity', label: '色彩强度' },
    { key: 'arousal', label: '情绪唤醒' },
    { key: 'fluency', label: '处理流畅' },
    { key: 'novelty', label: '新奇性' },
    { key: 'harmony', label: '和谐度' },
    { key: 'narrative', label: '叙事性' },
    { key: 'stylization', label: '风格化' },
  ] as const

  return (
    <>
    <div className="rounded-2xl border border-white/30 bg-white/70 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      {/* 头部：人格信息 + 收藏数徽章 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* 树形图标 */}
          <div className="text-5xl"></div>
          <div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">{stage.name}</div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">{currentPersona.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{currentPersona.en}</p>
          </div>
        </div>
        
        {/* 收藏数徽章 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{profile.favoriteCount}</span>
              <span className="text-[10px] text-white/80">收藏数</span>
            </div>
          </div>
        </div>
      </div>

      {/* 引言 */}
      <div className="mb-6 pl-4 border-l-4 border-emerald-500">
        <p className="font-serif text-lg italic text-gray-700 dark:text-gray-300 mb-2">
          「{currentPersona.tagline}」
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {currentPersona.description}
        </p>
      </div>

      {/* 雷达图 + 四周维度 */}
      <div className="relative flex items-center justify-center mb-6" style={{ minHeight: 320 }}>
        {/* 中间雷达图 */}
        <RadarChart vector={profile.vector} size={280} dimensions={dimensions} />
      </div>

      {/* 成长曲线 */}
      <GrowthCurve history={profile.history} />

      {/* 底部维度卡片 */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {dimensions.map(dim => {
          const IconComponent = DIMENSION_ICONS[dim.key]
          return (
            <div key={dim.key} className="rounded-xl bg-white/50 p-3 backdrop-blur-sm dark:bg-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">{dim.label}</span>
                <IconComponent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {Math.round(profile.vector[dim.key])}
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* 操作按钮 - 在卡片外面 */}
    <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
      <button
        onClick={handleDownloadCard}
        disabled={isGenerating}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {isGenerating ? '生成中...' : '下载美学人格卡片'}
      </button>
      <a
        href="/explore"
        className="btn-primary inline-flex items-center gap-2"
      >
        继续收藏
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
      <button
        onClick={() => setShowRetakeConfirm(true)}
        className="btn-secondary"
      >
        重新测试
      </button>
    </div>

    {/* 重新测试确认弹窗 */}
    {showRetakeConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认重新测试？</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">这将清除你当前的美学人格数据，重新开始测试。</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRetakeConfirm(false)} className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">取消</button>
            <button onClick={handleRetake} className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700">确认重新测试</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
