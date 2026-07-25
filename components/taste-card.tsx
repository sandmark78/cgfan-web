'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { analyzeTaste, readFavorites, FavoriteItem } from '@/lib/taste'
import { matchPersona, Persona } from '@/lib/personas'

interface TasteCardClientProps {
  serverFavorites: { slug: string; title: string; category: string; tags: string[]; model: string; cover: string }[]
  isLoggedIn: boolean
}

const ACCENT = '#455337'
const TEXT_DARK = '#3a3d32'
const TEXT_SOFT = '#7a7d6e'
const BG_CARD = '#f2ede6'
const BG_CREAM = '#f0ece5'
const LINE = '#d6d0c6'

export function TasteCardClient({ serverFavorites, isLoggedIn }: TasteCardClientProps) {
  const [persona, setPersona] = useState<Persona | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let favs: FavoriteItem[]
    if (isLoggedIn && serverFavorites.length > 0) {
      favs = serverFavorites.map(f => ({ slug: f.slug, title: f.title, category: f.category, tags: f.tags, model: f.model, image: f.cover, ts: Date.now() }))
    } else {
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

      const W = 600, H = 880
      canvas.width = W
      canvas.height = H

      // 背景：暖米色，像手工纸
      ctx.fillStyle = BG_CARD
      ctx.fillRect(0, 0, W, H)

      // 顶部细装饰线
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(40, 50)
      ctx.lineTo(90, 50)
      ctx.stroke()

      // 品牌标识
      ctx.fillStyle = TEXT_SOFT
      ctx.font = '10px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('CGFAN · 美学人格', 40, 44)

      // 编号
      const serial = String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)
      ctx.fillStyle = TEXT_SOFT
      ctx.textAlign = 'right'
      ctx.fillText(`NO.${serial}`, W - 40, 44)

      // "你是" — 极小字
      ctx.fillStyle = TEXT_SOFT
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('你是', 40, 100)

      // 人格名 — 大字宋体，深橄榄绿
      ctx.fillStyle = TEXT_DARK
      const name = persona.name
      const fontSize = name.length >= 6 ? 48 : name.length >= 5 ? 56 : 68
      ctx.font = `bold ${fontSize}px "Noto Serif SC", serif`
      ctx.fillText(name, 40, 165)

      // 英文名
      ctx.fillStyle = ACCENT
      ctx.font = '500 11px -apple-system, sans-serif'
      ctx.fillText(persona.en, 40, 192)

      // 签名 — 左边线
      ctx.strokeStyle = 'rgba(69, 83, 55, 0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(40, 220)
      ctx.lineTo(40, 252)
      ctx.stroke()

      ctx.fillStyle = 'rgba(58, 61, 50, 0.85)'
      ctx.font = '500 16px "Noto Serif SC", serif'
      ctx.fillText(`「 ${persona.tagline} 」`, 52, 240)

      // 分隔线
      ctx.strokeStyle = LINE
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, 285)
      ctx.lineTo(W - 40, 285)
      ctx.stroke()

      // 品味光谱
      ctx.fillStyle = TEXT_SOFT
      ctx.font = '10px -apple-system, sans-serif'
      ctx.fillText('品味光谱', 40, 315)

      const topCats = analysis.categories.slice(0, 3)
      topCats.forEach((cat: any, i: number) => {
        const y = 340 + i * 50

        ctx.fillStyle = 'rgba(58, 61, 50, 0.8)'
        ctx.font = '12px -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(cat.name, 40, y)

        // 进度条背景
        ctx.fillStyle = 'rgba(69, 83, 55, 0.1)'
        ctx.fillRect(120, y - 8, 360, 5)

        // 进度条填充 — 橄榄绿
        const barWidth = Math.round(cat.ratio * 360)
        if (persona.prismatic) {
          const gradient = ctx.createLinearGradient(120, 0, 120 + barWidth, 0)
          const colors = ['#FF4D6D', '#F97316', '#EAB308', '#6A994E', '#14B8A6', '#00E5FF', '#6B8CFF', '#9B7EDE']
          colors.forEach((c, idx) => gradient.addColorStop(idx / (colors.length - 1), c))
          ctx.fillStyle = gradient
        } else {
          ctx.fillStyle = ACCENT
        }
        ctx.fillRect(120, y - 8, barWidth, 5)

        ctx.fillStyle = TEXT_SOFT
        ctx.font = '11px -apple-system, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(cat.ratio * 100)}%`, W - 40, y)
      })

      // 关键词标签
      const topTags = analysis.topTags.slice(0, 4)
      let tagX = 40
      const tagY = 510

      topTags.forEach((tag: any) => {
        const tagText = `#${tag.name}`
        ctx.font = '11px -apple-system, sans-serif'
        const textWidth = ctx.measureText(tagText).width
        const padding = 10

        ctx.fillStyle = 'rgba(69, 83, 55, 0.06)'
        ctx.beginPath()
        ctx.roundRect(tagX, tagY - 14, textWidth + padding * 2, 22, 11)
        ctx.fill()

        ctx.strokeStyle = 'rgba(69, 83, 55, 0.2)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(tagX, tagY - 14, textWidth + padding * 2, 22, 11)
        ctx.stroke()

        ctx.fillStyle = 'rgba(58, 61, 50, 0.75)'
        ctx.textAlign = 'center'
        ctx.fillText(tagText, tagX + (textWidth + padding * 2) / 2, tagY + 4)

        tagX += textWidth + padding * 2 + 6
      })

      // 底部信息
      ctx.fillStyle = TEXT_SOFT
      ctx.font = '10px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')}`, 40, H - 50)
      ctx.fillText('www.cgfan.com/taste', 40, H - 35)

      // 印章 — 橄榄绿方形
      ctx.save()
      ctx.translate(W - 70, H - 45)
      ctx.rotate(-5 * Math.PI / 180)

      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 2
      ctx.strokeRect(-28, -28, 56, 56)

      ctx.strokeStyle = 'rgba(69, 83, 55, 0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(-25, -25, 50, 50)

      ctx.fillStyle = TEXT_DARK
      ctx.font = '900 18px "Noto Serif SC", serif'
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
        <h2 className="mb-3 font-serif text-2xl font-bold text-gray-900 dark:text-white">你的品味，值得一张卡片</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">收藏 {5} 个提示词，解锁专属于你的美学人格</p>
        <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-green-100 dark:bg-gray-700">
          <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-500" style={{ width: `${(favCount / 5) * 100}%` }} />
        </div>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">{favCount} / 5 {need > 0 ? `· 还差 ${need} 个` : '· 即将解锁！'}</p>
        <Link href="/explore" className="btn-primary inline-block">去收藏提示词 →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div ref={cardRef} className="mx-auto max-w-md overflow-hidden rounded-sm shadow-lg" style={{ background: BG_CARD }}>
        <div className="p-10">
          {/* 顶部装饰线 */}
          <div className="mb-8 h-0.5 w-12" style={{ background: ACCENT }} />

          <div className="flex items-center justify-between text-[10px]" style={{ color: TEXT_SOFT }}>
            <span className="tracking-[0.28em]">CGFAN · 美学人格</span>
            <span className="tracking-[0.15em]">NO.{String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)}</span>
          </div>

          <div className="mt-12">
            <div className="text-[11px] tracking-[0.4em]" style={{ color: TEXT_SOFT }}>你是</div>
            <h2 className="mt-2 font-serif font-black" style={{
              fontSize: persona.name.length >= 6 ? '48px' : persona.name.length >= 5 ? '56px' : '68px',
              lineHeight: 1.05,
              color: TEXT_DARK,
            }}>{persona.name}</h2>
            <div className="mt-1 text-[11px] font-medium tracking-[0.42em]" style={{ color: ACCENT }}>{persona.en}</div>
            <div className="mt-6 border-l-2 pl-4 font-serif text-base font-medium" style={{ borderColor: 'rgba(69,83,55,0.4)', color: 'rgba(58,61,50,0.85)' }}>
              「 {persona.tagline} 」
            </div>
          </div>

          <div className="mt-8 border-t" style={{ borderColor: LINE }}>
            <div className="mt-6 text-[10px] tracking-[0.3em]" style={{ color: TEXT_SOFT }}>品味光谱</div>
            {analysis.categories.slice(0, 3).map((cat: any) => (
              <div key={cat.name} className="mt-4 grid grid-cols-[72px_1fr_44px] items-center gap-3">
                <span className="text-xs" style={{ color: 'rgba(58,61,50,0.8)' }}>{cat.name}</span>
                <div className="h-1 overflow-hidden rounded-full" style={{ background: 'rgba(69,83,55,0.1)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.round(cat.ratio * 100)}%`,
                    background: persona.prismatic
                      ? 'linear-gradient(90deg, #FF4D6D, #F97316, #EAB308, #6A994E, #14B8A6, #00E5FF, #6B8CFF, #9B7EDE)'
                      : ACCENT,
                  }} />
                </div>
                <span className="text-right text-[11px] tabular-nums" style={{ color: TEXT_SOFT }}>{Math.round(cat.ratio * 100)}%</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {analysis.topTags.slice(0, 4).map((tag: any) => (
              <span key={tag.name} className="rounded-full border px-2.5 py-1 text-[11px]" style={{
                borderColor: 'rgba(69,83,55,0.2)',
                color: 'rgba(58,61,50,0.75)',
                background: 'rgba(69,83,55,0.05)',
              }}>#{tag.name}</span>
            ))}
          </div>

          <div className="mt-8 flex items-end justify-between" style={{ color: TEXT_SOFT }}>
            <div className="flex flex-col gap-1 text-[10px]">
              <span>生成于 {new Date().toLocaleDateString('zh-CN')}</span>
              <span>www.cgfan.com/taste</span>
            </div>
            <div className="grid h-[56px] w-[56px] place-items-center border-2 font-serif text-lg font-black" style={{
              borderColor: ACCENT,
              color: TEXT_DARK,
              transform: 'rotate(-5deg)',
              boxShadow: 'inset 0 0 0 1px rgba(69,83,55,0.2)',
              background: 'rgba(255,255,255,0.3)',
            }}>{persona.seal}</div>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} disabled={isGenerating}
        className="mx-auto flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        style={{ background: ACCENT }}>
        {isGenerating ? (
          <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>生成中...</>
        ) : (
          <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>下载品味卡片</>
        )}
      </button>
    </div>
  )
}