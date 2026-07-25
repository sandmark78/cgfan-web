'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { analyzeTaste, readFavorites, FavoriteItem } from '@/lib/taste'
import { matchPersona, Persona } from '@/lib/personas'

interface TasteCardClientProps {
  serverFavorites: { slug: string; title: string; category: string; tags: string[]; model: string; cover: string }[]
  isLoggedIn: boolean
}

const GREEN = '#4CAF50'
const GREEN_DARK = '#2E7D32'
const GREEN_LIGHT = '#66BB6A'
const BG_TOP = '#f0fdf4'
const BG_BOTTOM = '#f5faf0'

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

      const W = 600, H = 900
      canvas.width = W
      canvas.height = H

      // 背景：浅绿渐变 + 玻璃质感
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, BG_TOP)
      bg.addColorStop(0.5, '#f8fcf5')
      bg.addColorStop(1, BG_BOTTOM)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // 顶部绿色装饰条
      ctx.fillStyle = GREEN
      ctx.fillRect(0, 0, W, 6)

      // 品牌标识
      ctx.fillStyle = 'rgba(46, 125, 50, 0.65)'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('CGFAN · 美学人格', 40, 44)

      // 编号
      const serial = String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)
      ctx.fillStyle = 'rgba(46, 125, 50, 0.5)'
      ctx.textAlign = 'right'
      ctx.fillText(`NO.${serial}`, W - 40, 44)

      // "你是" — 小字
      ctx.fillStyle = 'rgba(46, 125, 50, 0.6)'
      ctx.font = '13px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('你是', 40, 110)

      // 人格名 — 大字宋体，深绿色
      ctx.fillStyle = GREEN_DARK
      const name = persona.name
      const fontSize = name.length >= 6 ? 50 : name.length >= 5 ? 58 : 72
      ctx.font = `bold ${fontSize}px "Noto Serif SC", serif`
      ctx.fillText(name, 40, 175)

      // 英文名
      ctx.fillStyle = GREEN
      ctx.font = '600 12px -apple-system, sans-serif'
      ctx.fillText(persona.en, 40, 205)

      // 签名 — 带绿色左边线
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(40, 235)
      ctx.lineTo(40, 270)
      ctx.stroke()

      ctx.fillStyle = 'rgba(46, 125, 50, 0.85)'
      ctx.font = '500 18px "Noto Serif SC", serif'
      ctx.fillText(`「 ${persona.tagline} 」`, 52, 255)

      // 分隔线
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(40, 300)
      ctx.lineTo(W - 40, 300)
      ctx.stroke()

      // 品味光谱
      ctx.fillStyle = 'rgba(46, 125, 50, 0.5)'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.fillText('品味光谱', 40, 330)

      const topCats = analysis.categories.slice(0, 3)
      topCats.forEach((cat: any, i: number) => {
        const y = 355 + i * 55

        ctx.fillStyle = 'rgba(46, 125, 50, 0.8)'
        ctx.font = '13px -apple-system, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(cat.name, 40, y)

        // 进度条背景 — 极淡绿
        ctx.fillStyle = 'rgba(76, 175, 80, 0.12)'
        ctx.fillRect(120, y - 8, 360, 6)

        // 进度条填充 — 绿色渐变
        const barWidth = Math.round(cat.ratio * 360)
        if (persona.prismatic) {
          const gradient = ctx.createLinearGradient(120, 0, 120 + barWidth, 0)
          const colors = ['#FF4D6D', '#F97316', '#EAB308', '#6A994E', '#14B8A6', '#00E5FF', '#6B8CFF', '#9B7EDE']
          colors.forEach((c, idx) => gradient.addColorStop(idx / (colors.length - 1), c))
          ctx.fillStyle = gradient
        } else {
          const barGrad = ctx.createLinearGradient(120, 0, 120 + barWidth, 0)
          barGrad.addColorStop(0, GREEN_LIGHT)
          barGrad.addColorStop(1, GREEN)
          ctx.fillStyle = barGrad
        }
        ctx.fillRect(120, y - 8, barWidth, 6)

        ctx.fillStyle = 'rgba(46, 125, 50, 0.7)'
        ctx.font = '12px -apple-system, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${Math.round(cat.ratio * 100)}%`, W - 40, y)
      })

      // 关键词标签 — 绿色胶囊
      const topTags = analysis.topTags.slice(0, 4)
      let tagX = 40
      const tagY = 540

      topTags.forEach((tag: any) => {
        const tagText = `#${tag.name}`
        ctx.font = '12px -apple-system, sans-serif'
        const textWidth = ctx.measureText(tagText).width
        const padding = 12

        // 胶囊背景
        ctx.fillStyle = 'rgba(76, 175, 80, 0.10)'
        ctx.beginPath()
        ctx.roundRect(tagX, tagY - 16, textWidth + padding * 2, 24, 12)
        ctx.fill()

        ctx.strokeStyle = 'rgba(76, 175, 80, 0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(tagX, tagY - 16, textWidth + padding * 2, 24, 12)
        ctx.stroke()

        ctx.fillStyle = 'rgba(46, 125, 50, 0.8)'
        ctx.textAlign = 'center'
        ctx.fillText(tagText, tagX + (textWidth + padding * 2) / 2, tagY + 4)

        tagX += textWidth + padding * 2 + 8
      })

      // 底部信息
      ctx.fillStyle = 'rgba(46, 125, 50, 0.4)'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')}`, 40, H - 55)

      ctx.fillStyle = 'rgba(46, 125, 50, 0.6)'
      ctx.fillText('www.cgfan.com/taste', 40, H - 38)

      // 印章 — 绿色印章
      ctx.save()
      ctx.translate(W - 75, H - 60)
      ctx.rotate(-6 * Math.PI / 180)

      if (persona.prismatic) {
        ctx.strokeStyle = '#94A3B8'
        ctx.fillStyle = '#94A3B8'
      } else {
        ctx.strokeStyle = GREEN
        ctx.fillStyle = GREEN_DARK
      }
      ctx.lineWidth = 2.5
      ctx.strokeRect(-30, -30, 60, 60)

      ctx.strokeStyle = persona.prismatic ? 'rgba(148,163,184,0.3)' : 'rgba(76,175,80,0.3)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(-27, -27, 54, 54)

      ctx.font = '900 20px "Noto Serif SC", serif'
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
      <div ref={cardRef} className="mx-auto max-w-md overflow-hidden rounded-2xl shadow-lg" style={{ background: '#fafcf8' }}>
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${GREEN_LIGHT}, ${GREEN})` }} />
        <div className="p-10">
          <div className="flex items-center justify-between text-xs">
            <span className="tracking-[0.28em]" style={{ color: 'rgba(46,125,50,0.65)' }}>CGFAN · 美学人格</span>
            <span className="tracking-[0.15em]" style={{ color: 'rgba(46,125,50,0.5)' }}>NO.{String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)}</span>
          </div>

          <div className="mt-14">
            <div className="text-sm tracking-[0.4em]" style={{ color: 'rgba(46,125,50,0.6)' }}>你是</div>
            <h2 className="mt-2 font-serif font-black" style={{
              fontSize: persona.name.length >= 6 ? '50px' : persona.name.length >= 5 ? '58px' : '72px',
              lineHeight: 1.05,
              color: GREEN_DARK,
            }}>{persona.name}</h2>
            <div className="mt-1 text-xs font-semibold tracking-[0.42em]" style={{ color: GREEN }}>{persona.en}</div>
            <div className="mt-6 border-l-[3px] pl-4 font-serif text-lg font-medium" style={{ borderColor: 'rgba(76,175,80,0.5)', color: 'rgba(46,125,50,0.85)' }}>
              「 {persona.tagline} 」
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 text-xs tracking-[0.3em]" style={{ color: 'rgba(46,125,50,0.5)' }}>品味光谱</div>
            {analysis.categories.slice(0, 3).map((cat: any) => (
              <div key={cat.name} className="mb-3 grid grid-cols-[72px_1fr_44px] items-center gap-3">
                <span className="text-[13px]" style={{ color: 'rgba(46,125,50,0.8)' }}>{cat.name}</span>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(76,175,80,0.12)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.round(cat.ratio * 100)}%`,
                    background: persona.prismatic
                      ? 'linear-gradient(90deg, #FF4D6D, #F97316, #EAB308, #6A994E, #14B8A6, #00E5FF, #6B8CFF, #9B7EDE)'
                      : `linear-gradient(90deg, ${GREEN_LIGHT}, ${GREEN})`,
                  }} />
                </div>
                <span className="text-right text-xs tabular-nums" style={{ color: 'rgba(46,125,50,0.7)' }}>{Math.round(cat.ratio * 100)}%</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {analysis.topTags.slice(0, 4).map((tag: any) => (
              <span key={tag.name} className="rounded-full border px-3 py-1 text-xs" style={{
                borderColor: 'rgba(76,175,80,0.25)',
                color: 'rgba(46,125,50,0.8)',
                background: 'rgba(76,175,80,0.08)',
              }}>#{tag.name}</span>
            ))}
          </div>

          <div className="mt-8 flex items-end justify-between border-t pt-6" style={{ borderColor: 'rgba(76,175,80,0.12)' }}>
            <div className="flex flex-col gap-1 text-xs" style={{ color: 'rgba(46,125,50,0.4)' }}>
              <span>生成于 {new Date().toLocaleDateString('zh-CN')}</span>
              <span style={{ color: 'rgba(46,125,50,0.6)' }}>www.cgfan.com/taste</span>
            </div>
            <div className="grid h-[60px] w-[60px] place-items-center rounded-[8px] border-2 font-serif text-xl font-black" style={{
              borderColor: persona.prismatic ? '#94A3B8' : GREEN,
              color: persona.prismatic ? '#94A3B8' : GREEN_DARK,
              transform: 'rotate(-6deg)',
              boxShadow: persona.prismatic ? 'inset 0 0 0 2px rgba(148,163,184,0.3)' : 'inset 0 0 0 2px rgba(76,175,80,0.2)',
              background: 'rgba(255,255,255,0.5)',
            }}>{persona.seal}</div>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} disabled={isGenerating}
        className="mx-auto flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${GREEN_LIGHT}, ${GREEN})` }}>
        {isGenerating ? (
          <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>生成中...</>
        ) : (
          <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>下载品味卡片</>
        )}
      </button>
    </div>
  )
}