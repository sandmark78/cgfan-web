'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { analyzeTaste, readFavorites, FavoriteItem } from '@/lib/taste'
import { matchPersona, rankPersonas, Persona } from '@/lib/personas'

interface TasteCardClientProps {
  serverFavorites: { slug: string; title: string; category: string; tags: string[]; model: string; cover: string }[]
  isLoggedIn: boolean
}

/**
 * 品味卡片客户端组件 - 处理登录态 + localStorage 双模式
 */
export function TasteCardClient({ serverFavorites, isLoggedIn }: TasteCardClientProps) {
  const [persona, setPersona] = useState<Persona | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let favs: FavoriteItem[]

    if (isLoggedIn && serverFavorites.length > 0) {
      // 登录态：从服务器数据构建
      favs = serverFavorites.map(f => ({
        slug: f.slug,
        title: f.title,
        category: f.category,
        tags: f.tags,
        model: f.model,
        image: f.cover,
        ts: Date.now(),
      }))
    } else {
      // 未登录：从 localStorage 读取
      favs = readFavorites()
    }

    setFavorites(favs)
    if (favs.length >= 5) {
      const a = analyzeTaste(favs)
      setAnalysis(a)
      setPersona(matchPersona(a))
    }
  }, [isLoggedIn, serverFavorites])

  const handleDownload = async () => {
    if (!cardRef.current || !persona) return
    setIsGenerating(true)

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      const W = 600
      const H = 900
      canvas.width = W
      canvas.height = H

      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#0a0e0a')
      bg.addColorStop(1, '#1a1f1a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = persona.accent
      ctx.fillRect(0, 0, W, 8)

      ctx.fillStyle = 'rgba(242, 240, 233, 0.65)'
      ctx.font = '12px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('CGFAN · 美学人格', 40, 50)

      const serial = String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)
      ctx.fillStyle = persona.accent
      ctx.textAlign = 'right'
      ctx.fillText(`NO.${serial}`, W - 40, 50)

      ctx.fillStyle = 'rgba(242, 240, 233, 0.6)'
      ctx.font = '14px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('你是', 40, 120)

      ctx.fillStyle = '#ffffff'
      const name = persona.name
      const fontSize = name.length >= 6 ? 54 : name.length >= 5 ? 62 : 76
      ctx.font = `bold ${fontSize}px "Noto Serif SC", serif`
      ctx.fillText(name, 40, 200)

      ctx.fillStyle = persona.accent
      ctx.font = '600 13px -apple-system, sans-serif'
      ctx.fillText(persona.en, 40, 230)

      ctx.fillStyle = 'rgba(242, 240, 233, 0.92)'
      ctx.font = '500 20px "Noto Serif SC", serif'
      ctx.fillText(`「 ${persona.tagline} 」`, 40, 280)

      ctx.strokeStyle = persona.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(40, 310)
      ctx.lineTo(100, 310)
      ctx.stroke()

      ctx.fillStyle = 'rgba(242, 240, 233, 0.55)'
      ctx.font = '12px -apple-system, sans-serif'
      ctx.fillText('品味光谱', 40, 350)

      const topCats = analysis.categories.slice(0, 3)
      topCats.forEach((cat: any, i: number) => {
        const y = 380 + i * 60
        ctx.fillStyle = 'rgba(242, 240, 233, 0.85)'
        ctx.font = '13px -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(cat.name, 40, y)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
        ctx.fillRect(120, y - 10, 360, 8)

        const barWidth = Math.round(cat.ratio * 360)
        if (persona.prismatic) {
          const gradient = ctx.createLinearGradient(120, 0, 120 + barWidth, 0)
          const colors = ['#FF4D6D', '#F97316', '#EAB308', '#6A994E', '#14B8A6', '#00E5FF', '#6B8CFF', '#9B7EDE']
          colors.forEach((color, idx) => gradient.addColorStop(idx / (colors.length - 1), color))
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = persona.accent
        }
        ctx.fillRect(120, y - 10, barWidth, 8)

        ctx.fillStyle = persona.accent
        ctx.font = '13px -apple-system, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(cat.ratio * 100)}%`, W - 40, y)
      })

      const topTags = analysis.topTags.slice(0, 4)
      let tagX = 40
      const tagY = 580

      topTags.forEach((tag: any) => {
        const tagText = `#${tag.name}`
        ctx.font = '13px -apple-system, sans-serif'
        const textWidth = ctx.measureText(tagText).width
        const padding = 12

        ctx.fillStyle = `${persona.accent}20`
        ctx.strokeStyle = `${persona.accent}88`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(tagX, tagY - 18, textWidth + padding * 2, 26, 13)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = persona.accent
        ctx.textAlign = 'left'
        ctx.fillText(tagText, tagX + padding, tagY)
        tagX += textWidth + padding * 2 + 8
      })

      ctx.fillStyle = 'rgba(242, 240, 233, 0.55)'
      ctx.font = '12px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')}`, 40, H - 60)

      ctx.fillStyle = 'rgba(242, 240, 233, 0.8)'
      ctx.fillText('www.cgfan.com/taste', 40, H - 40)

      ctx.save()
      ctx.translate(W - 80, H - 80)
      ctx.rotate(-8 * Math.PI / 180)

      ctx.strokeStyle = persona.prismatic ? '#94A3B8' : '#C8402F'
      ctx.lineWidth = 3
      ctx.strokeRect(-36, -36, 72, 72)

      ctx.strokeStyle = persona.prismatic ? 'rgba(148, 163, 184, 0.3)' : 'rgba(200, 64, 47, 0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(-32, -32, 64, 64)

      ctx.fillStyle = persona.prismatic ? '#94A3B8' : '#D0442E'
      ctx.font = '900 24px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(persona.seal, 0, 0)
      ctx.restore()

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CGfan美学人格-${persona.name}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('生成卡片失败:', error)
      alert('下载失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!persona || !analysis) {
    const favCount = favorites.length
    const need = 5 - favCount
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-8 text-6xl">🎨</div>
        <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900 dark:text-white">
          你的品味，值得一张卡片
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          收藏 {5} 个提示词，解锁专属于你的美学人格
        </p>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
            style={{ width: `${(favCount / 5) * 100}%` }}
          />
        </div>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          {favCount} / 5 {need > 0 ? `· 还差 ${need} 个` : '· 即将解锁！'}
        </p>
        <Link href="/explore" className="btn-primary inline-block">
          去收藏提示词 →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div ref={cardRef} className="mx-auto max-w-md overflow-hidden rounded-lg shadow-2xl" style={{ background: '#0a0e0a' }}>
        <div className="h-2" style={{ background: persona.accent }} />
        <div className="p-10 text-[#F2F0E9]">
          <div className="flex items-center justify-between text-xs">
            <span className="tracking-[0.28em] opacity-65">CGFAN · 美学人格</span>
            <span className="tracking-[0.15em]" style={{ color: persona.accent }}>
              NO.{String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)}
            </span>
          </div>
          <div className="mt-16">
            <div className="text-sm tracking-[0.4em] opacity-60">你是</div>
            <h2 className="mt-2 font-serif font-black text-white" style={{
              fontSize: persona.name.length >= 6 ? '54px' : persona.name.length >= 5 ? '62px' : '76px',
              lineHeight: 1.05,
              textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}>
              {persona.name}
            </h2>
            <div className="mt-1 text-[13px] font-semibold tracking-[0.42em]" style={{ color: persona.accent }}>
              {persona.en}
            </div>
            <div className="mt-6 border-l-2 pl-4 font-serif text-xl font-medium opacity-92" style={{ borderColor: persona.accent }}>
              「 {persona.tagline} 」
            </div>
          </div>
          <div className="mt-10">
            <div className="mb-3 text-xs tracking-[0.3em] opacity-55">品味光谱</div>
            {analysis.categories.slice(0, 3).map((cat: any, i: number) => (
              <div key={cat.name} className="mb-3 grid grid-cols-[72px_1fr_44px] items-center gap-3">
                <span className="text-[13px] opacity-85">{cat.name}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/12">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.round(cat.ratio * 100)}%`,
                    background: persona.prismatic
                      ? 'linear-gradient(90deg, #FF4D6D, #F97316, #EAB308, #6A994E, #14B8A6, #00E5FF, #6B8CFF, #9B7EDE)'
                      : `linear-gradient(90deg, ${persona.accent}, ${persona.accent}99)`,
                  }} />
                </div>
                <span className="text-right text-[13px] tabular-nums" style={{ color: persona.accent }}>
                  {Math.round(cat.ratio * 100)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {analysis.topTags.slice(0, 4).map((tag: any) => (
              <span key={tag.name} className="rounded-full border px-3 py-1 text-[13px]" style={{
                borderColor: `${persona.accent}55`,
                color: persona.accent,
                background: `${persona.accent}20`,
              }}>
                #{tag.name}
              </span>
            ))}
          </div>
          <div className="mt-8 flex items-end justify-between">
            <div className="flex flex-col gap-1 text-xs opacity-55">
              <span>生成于 {new Date().toLocaleDateString('zh-CN')}</span>
              <span className="opacity-80">www.cgfan.com/taste</span>
            </div>
            <div className="grid h-[72px] w-[72px] place-items-center rounded-[10px] border-[3px] font-serif text-2xl font-black" style={{
              borderColor: persona.prismatic ? '#94A3B8' : '#C8402F',
              color: persona.prismatic ? '#94A3B8' : '#D0442E',
              transform: 'rotate(-8deg)',
              boxShadow: `inset 0 0 0 2px ${persona.prismatic ? 'rgba(148,163,184,0.3)' : 'rgba(200,64,47,0.3)'}`,
            }}>
              {persona.seal}
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} disabled={isGenerating}
        className="btn-primary mx-auto flex items-center gap-2 px-8 py-3 disabled:opacity-50">
        {isGenerating ? (
          <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>生成中...</>
        ) : (
          <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>下载品味卡片</>
        )}
      </button>
    </div>
  )
}