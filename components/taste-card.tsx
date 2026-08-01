'use client'

import { useState, useEffect, useRef } from 'react'
import { UserProfile, loadProfile, saveProfile, clearProfile, getGrowthStage, GROWTH_STAGES } from '@/lib/aesthetic-dynamic'
import { BASE_PERSONAS, Persona } from '@/lib/personas'
import { AestheticVector } from '@/lib/aesthetic-engine'
import { getPersonaRarity, getPersonaCompatibility } from '@/lib/persona-rarity'
import { AestheticQuiz } from './aesthetic-quiz'
import { Puzzle, Palette, Heart, Waves, Star, Scale, ScrollText, Paintbrush, Download, Sparkles, Share2 } from 'lucide-react'

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
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null)
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

  const handleSharePersona = async () => {
    if (!profile || !currentPersona) return
    
    const rarity = getPersonaRarity(currentPersona.id)
    const shareUrl = `${window.location.origin}/api/og-persona?name=${encodeURIComponent(currentPersona.name)}&nickname=${encodeURIComponent(currentPersona.nickname)}&rarity=${rarity.tier}&traits=${encodeURIComponent(currentPersona.tags.slice(0, 3).join(','))}`
    
    const shareText = `我在 CGfan 的美学人格是「${currentPersona.name}」${currentPersona.nickname ? `（${currentPersona.nickname}）` : ''}，${rarity.label}人格！来发现你的美学人格 →`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的美学人格',
          text: shareText,
          url: window.location.origin + '/taste',
        })
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.origin}/taste`)
        alert('已复制到剪贴板！')
      } catch (err) {
        alert('分享链接生成失败')
      }
    }
  }

  const handleDownloadCard = async () => {
    if (!profile || !currentPersona) return
    setIsGenerating(true)
    
    try {
      const canvas = document.createElement('canvas')
      const dpr = window.devicePixelRatio || 2
      // 1080×1350 = 4:5 竖版，适合社交媒体
      const W = 1080
      const H = 1350
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = (W / 2) + 'px'
      canvas.style.height = (H / 2) + 'px'
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')
      
      ctx.scale(dpr, dpr)
      
      // ── 配色：克制的绿系 ──
      const C = {
        bg:       '#F8FAF6',
        ink:      '#2D5F3E',    // 深墨绿
        inkMid:   '#4A8C62',    // 中绿
        inkLight: '#7BAF8E',    // 浅绿
        soft:     '#8FA898',    // 灰绿
        softest:  '#B8C9BE',    // 最淡
        line:     'rgba(45,95,62,0.12)',
        radar:    'rgba(74,140,98,0.15)',
        radarStroke: '#4A8C62',
        accent:   '#C4553A',    // 印章红（唯一暖色点缀）
      }
      
      // ── 加载背景图 ──
      const bgImg = new Image()
      bgImg.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve()
        bgImg.onerror = () => reject(new Error('Background image load failed'))
        bgImg.src = '/images/taste-card-bg.jpg'
      })
      
      // 绘制背景图（铺满画布）
      ctx.drawImage(bgImg, 0, 0, W, H)
      
      // ── 加载人格徽章 ──
      const badgeImg = new Image()
      badgeImg.crossOrigin = 'anonymous'
      await new Promise<void>((resolve) => {
        badgeImg.onload = () => resolve()
        badgeImg.onerror = () => resolve() // 徽章加载失败不阻塞
        badgeImg.src = `/images/personas/${currentPersona.nickname}.png`
      })
      
      // ── 徽章（顶部中央，参考图位置） ──
      const badgeSize = 280
      const badgeX = (W - badgeSize) / 2
      const badgeY = 0
      ctx.drawImage(badgeImg, badgeX, badgeY, badgeSize, badgeSize)
      
      // ── 人格缩写（右上角，参考图位置） ──
      ctx.font = `400 24px -apple-system, "Helvetica Neue", sans-serif`
      ctx.fillStyle = C.ink
      ctx.textAlign = 'right'
      ctx.letterSpacing = '4px'
      ctx.fillText(currentPersona.nickname, W - 84, 100)
      ctx.letterSpacing = '0px'
      ctx.textAlign = 'center'
      
      // ── 人格名（居中，大字宋体） ──
      const nameY = 385  // 下移25px
      const nameLen = currentPersona.name.length
      const nameSize = nameLen >= 6 ? 96 : nameLen === 5 ? 108 : nameLen === 4 ? 120 : 132
      ctx.font = `900 ${nameSize}px "Noto Serif SC", "Songti SC", "SimSun", serif`
      ctx.fillStyle = C.ink
      ctx.textAlign = 'center'
      ctx.fillText(currentPersona.name, W / 2, nameY)
      
      // ── 英文名（居中） ──
      ctx.font = `300 22px -apple-system, "Helvetica Neue", sans-serif`
      ctx.fillStyle = C.soft
      ctx.letterSpacing = '2px'
      ctx.fillText(currentPersona.en, W / 2, nameY + 56)
      ctx.letterSpacing = '0px'
      
      // ── Tagline（居中，宋体斜体） ──
      const taglineY = nameY + 100
      ctx.font = `italic 500 32px "Noto Serif SC", "Songti SC", serif`
      ctx.fillStyle = C.inkMid
      ctx.textAlign = 'center'
      ctx.fillText(`「${currentPersona.tagline}」`, W / 2, taglineY)
      
      // ── 描述文字（居中） ──
      const descY = taglineY + 48
      ctx.font = `400 15px "Noto Serif SC", "Songti SC", serif`
      ctx.fillStyle = C.soft
      const maxTextW = W - 200
      const chars = (currentPersona.description || '').split('')
      let line = ''
      let ly = descY
      const lineH = 26
      let lineCount = 0
      
      for (let i = 0; i < chars.length; i++) {
        const testLine = line + chars[i]
        if (ctx.measureText(testLine).width > maxTextW && line.length > 0) {
          ctx.fillText(line, W / 2, ly)
          line = chars[i]
          ly += lineH
          lineCount++
          if (lineCount >= 2) break
        } else {
          line = testLine
        }
      }
      if (line && lineCount < 2) {
        ctx.fillText(line, W / 2, ly)
      }
      
      // ── 8维雷达图（规则圆形布局，中心对齐图片中心） ──
      const radarCX = 540
      const radarCY = 700  // 下移25px
      const radarR = 113  // 162 * 0.7 = 113.4，缩小30%
      
      const dims = [
        { key: 'complexity', label: '复杂度' },
        { key: 'colorIntensity', label: '色彩' },
        { key: 'arousal', label: '情绪' },
        { key: 'fluency', label: '流畅' },
        { key: 'novelty', label: '新奇' },
        { key: 'harmony', label: '和谐' },
        { key: 'narrative', label: '叙事' },
        { key: 'stylization', label: '风格' },
      ] as const
      
      const angleStep = (Math.PI * 2) / 8
      
      // 背景网格（2层：中圈50，外圈100）
      // 中圈 = 50分
      ctx.beginPath()
      for (let i = 0; i <= 8; i++) {
        const angle = -Math.PI / 2 + i * angleStep
        const r = radarR * 0.5
        const x = radarCX + Math.cos(angle) * r
        const y = radarCY + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = C.radar
      ctx.lineWidth = 1
      ctx.stroke()
      
      // 外圈 = 100分
      ctx.beginPath()
      for (let i = 0; i <= 8; i++) {
        const angle = -Math.PI / 2 + i * angleStep
        const x = radarCX + Math.cos(angle) * radarR
        const y = radarCY + Math.sin(angle) * radarR
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = C.radar
      ctx.lineWidth = 1
      ctx.stroke()
      
      // 辐射线
      for (let i = 0; i < 8; i++) {
        const angle = -Math.PI / 2 + i * angleStep
        ctx.beginPath()
        ctx.moveTo(radarCX, radarCY)
        ctx.lineTo(
          radarCX + Math.cos(angle) * radarR,
          radarCY + Math.sin(angle) * radarR
        )
        ctx.strokeStyle = C.radar
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      
      // 数据区域
      ctx.beginPath()
      for (let i = 0; i <= 8; i++) {
        const idx = i % 8
        const angle = -Math.PI / 2 + idx * angleStep
        const val = profile.vector[dims[idx].key as keyof typeof profile.vector] / 100
        const x = radarCX + Math.cos(angle) * radarR * val
        const y = radarCY + Math.sin(angle) * radarR * val
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(74,140,98,0.18)'
      ctx.fill()
      ctx.strokeStyle = C.radarStroke
      ctx.lineWidth = 2.5
      ctx.stroke()
      
      // 数据点 + 标签
      for (let i = 0; i < 8; i++) {
        const angle = -Math.PI / 2 + i * angleStep
        const val = profile.vector[dims[i].key as keyof typeof profile.vector] / 100
        const px = radarCX + Math.cos(angle) * radarR * val
        const py = radarCY + Math.sin(angle) * radarR * val
        
        // 数据点
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fillStyle = C.inkMid
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
        
        // 标签
        const labelR = radarR + 18  // 25 * 0.7 = 17.5，同比内收
        const lx = radarCX + Math.cos(angle) * labelR
        const ly = radarCY + Math.sin(angle) * labelR
        const v = Math.round(profile.vector[dims[i].key as keyof typeof profile.vector])
        
        ctx.font = `500 13px -apple-system, "PingFang SC", sans-serif`
        ctx.fillStyle = C.soft
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${dims[i].label}`, lx, ly - 9)
        
        ctx.font = `700 15px -apple-system, sans-serif`
        ctx.fillStyle = C.ink
        ctx.fillText(`${v}`, lx, ly + 9)
      }
      
      // ── 名人名言（居中，作者署名右对齐） ──
      if (currentPersona.quote) {
        const quoteStartY = 1080  // 下移30px
        const boxPadX = 28
        const textW = 420 - boxPadX * 2
        
        const quoteParts = currentPersona.quote.split('——')
        const quoteText = quoteParts[0].trim()
        const quoteAuthor = quoteParts[1] ? `—— ${quoteParts[1].trim()}` : ''
        
        ctx.font = `italic 400 15px "Noto Serif SC", "Songti SC", serif`
        const quoteChars = quoteText.split('')
        let qLine = ''
        const qLines: string[] = []
        const qLineH = 24
        
        for (let i = 0; i < quoteChars.length; i++) {
          const testLine = qLine + quoteChars[i]
          if (ctx.measureText(testLine).width > textW && qLine.length > 0) {
            qLines.push(qLine)
            qLine = quoteChars[i]
          } else {
            qLine = testLine
          }
        }
        if (qLine) qLines.push(qLine)
        
        // 名言居中
        ctx.font = `italic 400 22px "Noto Serif SC", "Songti SC", serif`
        ctx.fillStyle = C.inkMid
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        
        let qly = quoteStartY
        for (const line of qLines) {
          ctx.fillText(line, W / 2, qly)
          qly += qLineH * 2
        }
        
        // 作者署名右对齐
        if (quoteAuthor) {
          ctx.font = `500 22px -apple-system, "Helvetica Neue", sans-serif`
          ctx.fillStyle = C.ink
          ctx.textAlign = 'right'
          ctx.fillText(quoteAuthor, W / 2 + 210 - boxPadX, qly + 8)
        }
        
        ctx.textBaseline = 'alphabetic'
      }
      
      // ── 底部区域 ──
      const bottomY = H - 60
      
      // 左侧：日期
      ctx.font = `400 12px -apple-system, sans-serif`
      ctx.fillStyle = C.softest
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      ctx.fillText(date, 70, bottomY)
      
      // ── 下载 ──
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
      {/* 头部：人格信息 + 昵称稀有度 + 收藏数徽章 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{stage.name}</span>
              {(() => {
                const rarity = getPersonaRarity(currentPersona.id)
                const tierColors: Record<string, string> = { common: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', legendary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' }
                return (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tierColors[rarity.tier] || tierColors.common}`}>
                    {rarity.label} · {rarity.percentage}%
                  </span>
                )
              })()}
            </div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
              {currentPersona.name}
              <span className="ml-2 text-lg font-mono font-normal text-gray-400 dark:text-gray-500 align-middle">
                {currentPersona.nickname}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{currentPersona.en}</p>
          </div>
        </div>
        
        {/* 收藏数徽章 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{profile.favoriteCount}</span>
              <span className="text-[10px] text-white/80">收藏</span>
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
          {currentPersona.description || ''}
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

      {/* 互补人格推荐 */}
      {(() => {
        const compatibilities = getPersonaCompatibility(currentPersona.id)
        if (compatibilities.length === 0) return null
        return (
          <div className="mt-6 rounded-xl bg-white/50 p-4 backdrop-blur-sm dark:bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">审美互补人格</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {compatibilities.map((comp, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm dark:bg-gray-800/40">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{comp.persona.name}</div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{comp.persona.nickname}</span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${comp.compatibility}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{comp.compatibility}%</span>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{comp.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>

    {/* 操作按钮 - 在卡片外面 */}
    <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
      <button
        onClick={handleDownloadCard}
        disabled={isGenerating}
        aria-label="下载美学人格卡片"
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {isGenerating ? '生成中...' : '下载美学人格卡片'}
      </button>
      <button
        onClick={handleSharePersona}
        aria-label="分享我的人格"
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        分享我的人格
      </button>
      <a
        href="/explore"
        aria-label="继续收藏提示词"
        className="btn-primary inline-flex items-center gap-2"
      >
        继续收藏
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
      <button
        onClick={() => setShowRetakeConfirm(true)}
        aria-label="重新测试美学人格"
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
