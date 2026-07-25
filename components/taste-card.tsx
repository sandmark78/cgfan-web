'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { analyzeTaste, readFavorites, FavoriteItem } from '@/lib/taste'
import { matchPersona, Persona } from '@/lib/personas'

interface TasteCardClientProps {
  serverFavorites: { slug: string; title: string; category: string; tags: string[]; model: string; cover: string }[]
  isLoggedIn: boolean
}

// ============ 配色：纯绿系 ============
const C = {
  bgTop: '#F2F7EE', bgBot: '#D4E4C4',
  ink: '#2F6B45',
  inkDeep: '#1F3A2C',
  soft: '#6B8472',
  soft2: '#8AA091',
  track: 'rgba(47,107,69,.13)',
  line: 'rgba(47,107,69,.26)',
  lineSoft: 'rgba(47,107,69,.14)',
  pill: '#2F6B45', pillInk: '#F2F7EE',
  spectrum: ['#1F3A2C', '#2F6B45', '#4F8F54', '#7FB069', '#A9C79B', '#C6DBB8'],
}
const SERIF = '"Noto Serif SC","Songti SC",serif'
const SANS = 'system-ui,sans-serif'

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function spaced(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, sp: number, right?: boolean) {
  const widths = [...str].map(ch => ctx.measureText(ch).width + sp)
  const total = widths.reduce((a, b) => a + b, 0) - sp
  let cx = right ? x - total : x
  ctx.textAlign = 'left'
  ;[...str].forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += widths[i] })
}

function wrap(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, maxW: number, lh: number) {
  let line = '', yy = y
  for (const ch of str) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, yy); line = ch; yy += lh }
    else line += ch
  }
  ctx.fillText(line, x, yy)
}

function drawLeafShadow(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.translate(70, 60); ctx.rotate(-0.5)
  ctx.fillStyle = 'rgba(47,107,69,.05)'
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.translate(i * 16, i * 22); ctx.rotate(0.3 * i)
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 26, 0, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function drawWaxSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, text: string) {
  ctx.save()
  ctx.fillStyle = '#234A31'
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 6, 0, Math.PI * 2)
    ctx.fill()
  }
  const g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, 2, cx, cy, r)
  g.addColorStop(0, '#4F8F54'); g.addColorStop(.6, '#2F6B45'); g.addColorStop(1, '#1B3A27')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(180,220,150,.35)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx, cy, r - 8, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
  ctx.save()
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `900 22px ${SERIF}`
  ctx.shadowColor = 'rgba(190,225,170,.55)'; ctx.shadowOffsetY = 1.2; ctx.shadowBlur = 0
  ctx.fillStyle = '#16301F'
  const chars = [...text], n = chars.length
  chars.forEach((ch, i) => ctx.fillText(ch, cx, cy + (i - (n - 1) / 2) * 24))
  ctx.restore()
}

function renderCard(ctx: CanvasRenderingContext2D, data: {
  persona: Persona; analysis: any; serial: string; tags: string[]; date: string; url: string
}) {
  const W = 600, H = 880
  const { persona, analysis, serial, tags, date, url } = data

  // 背景：浅绿白渐变
  let g = ctx.createLinearGradient(0, 0, W * .3, H)
  g.addColorStop(0, C.bgTop); g.addColorStop(1, C.bgBot)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // 纸感：左上窗光 + 叶影
  let rg = ctx.createRadialGradient(120, 90, 10, 120, 90, 320)
  rg.addColorStop(0, 'rgba(255,255,255,.5)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H)
  drawLeafShadow(ctx)

  // 标本卡双线内框
  ctx.lineWidth = 1; ctx.strokeStyle = C.line
  rr(ctx, 20, 20, W - 40, H - 40, 14); ctx.stroke()
  ctx.strokeStyle = C.lineSoft
  rr(ctx, 26, 26, W - 52, H - 52, 11); ctx.stroke()

  // 顶部双行标题
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = C.ink; ctx.font = `600 13px ${SANS}`
  spaced(ctx, 'CGFAN · 美学人格', 44, 56, 2)
  ctx.fillStyle = C.soft2; ctx.font = `500 9px ${SANS}`
  spaced(ctx, 'AESTHETIC PERSONALITY', 44, 72, 1.4)
  ctx.textAlign = 'right'
  ctx.fillStyle = C.ink; ctx.font = `600 13px ${SANS}`
  spaced(ctx, 'NO.' + serial, W - 44, 56, 1.5, true)
  ctx.fillStyle = C.soft2; ctx.font = `500 9px ${SANS}`
  spaced(ctx, '探索你的美学光谱', W - 44, 72, 1.2, true)
  ctx.textAlign = 'left'

  // 左侧竖线强调
  ctx.fillStyle = C.ink
  ctx.fillRect(46, 150, 3, 168)

  const LX = 66

  // 你是
  ctx.fillStyle = C.soft; ctx.font = `500 13px ${SANS}`
  spaced(ctx, '你 是', LX, 150, 4)

  // 人格名
  const name = persona.name
  const fs = name.length >= 6 ? 52 : name.length >= 5 ? 60 : 70
  ctx.fillStyle = C.ink; ctx.font = `900 ${fs}px ${SERIF}`
  ctx.fillText(name, LX, 232)

  // 英文名
  ctx.fillStyle = C.ink; ctx.font = `600 12px ${SANS}`
  spaced(ctx, persona.en, LX, 268, 5)

  // 签名
  ctx.fillStyle = C.soft; ctx.font = `500 17px ${SERIF}`
  wrap(ctx, '「 ' + persona.tagline + ' 」', LX, 312, W - LX - 44, 26)

  // 装饰短线 + 菱形
  ctx.strokeStyle = C.lineSoft; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(LX, 360); ctx.lineTo(LX + 64, 360); ctx.stroke()
  ctx.fillStyle = C.lineSoft; ctx.save()
  ctx.translate(LX + 70, 360); ctx.rotate(Math.PI / 4)
  ctx.fillRect(-2.5, -2.5, 5, 5); ctx.restore()

  // 品味光谱
  ctx.fillStyle = C.soft; ctx.font = `500 11px ${SANS}`
  spaced(ctx, '品 味 光 谱', LX, 400, 3)

  // 光谱条：多绿渐变
  const rows = analysis.categories.slice(0, 3)
  const trackX = 168, trackW = 300, pctX = W - 44
  rows.forEach((c: any, i: number) => {
    const y = 432 + i * 34
    ctx.textAlign = 'right'; ctx.fillStyle = C.ink; ctx.font = `500 13px ${SANS}`
    ctx.fillText(c.name, trackX - 14, y + 4)
    ctx.fillStyle = C.track; rr(ctx, trackX, y - 4, trackW, 8, 4); ctx.fill()
    const fw = Math.max(8, trackW * c.ratio)
    if (persona.prismatic) {
      let sg = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0)
      '#FF4D6D,#F97316,#EAB308,#6A994E,#14B8A6,#00E5FF,#6B8CFF,#9B7EDE'.split(',').forEach((c, k) => sg.addColorStop(k / 7, c))
      ctx.fillStyle = sg
    } else {
      let sg = ctx.createLinearGradient(trackX, 0, trackX + trackW, 0)
      C.spectrum.forEach((s, k) => sg.addColorStop(k / (C.spectrum.length - 1), s))
      ctx.fillStyle = sg
    }
    rr(ctx, trackX, y - 4, fw, 8, 4); ctx.fill()
    ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = `600 13px ${SANS}`
    ctx.fillText(Math.round(c.ratio * 100) + '%', pctX - 36, y + 4)
  })
  ctx.textAlign = 'left'

  // 实心绿胶囊标签
  let px = LX, py = 556
  ctx.font = `500 12.5px ${SANS}`
  tags.slice(0, 4).forEach(t => {
    const tw = ctx.measureText(t).width + 26
    if (px + tw > W - 44) { px = LX; py += 34 }
    ctx.fillStyle = C.pill; rr(ctx, px, py - 18, tw, 28, 14); ctx.fill()
    ctx.fillStyle = C.pillInk; ctx.textAlign = 'center'
    ctx.fillText(t, px + tw / 2, py + 1); ctx.textAlign = 'left'
    px += tw + 10
  })

  // 右下：圆火漆章
  drawWaxSeal(ctx, W - 92, 742, 40, persona.seal)

  // 左下 meta
  ctx.fillStyle = C.soft2; ctx.font = `500 11px ${SANS}`
  ctx.fillText('生成于 ' + date, LX, 792)
  ctx.fillText(url, LX, 812)
}

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
    if (!persona || !analysis) return
    setIsGenerating(true)
    try {
      await document.fonts.ready
      await document.fonts.load('900 64px "Noto Serif SC"')

      const W = 600, H = 880, dpr = 2
      const canvas = document.createElement('canvas')
      canvas.width = W * dpr; canvas.height = H * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')
      ctx.scale(dpr, dpr)

      const serial = String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)
      const tags = analysis.topTags.slice(0, 4).map((t: any) => `#${t.name}`)
      const date = new Date().toLocaleDateString('zh-CN')
      const url = 'www.cgfan.com/taste'

      renderCard(ctx, { persona, analysis, serial, tags, date, url })

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `CGfan美学人格-${persona.name}.png`
      a.click()
      URL.revokeObjectURL(blobUrl)
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
        <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-[#D4E4C4] dark:bg-gray-700">
          <div className="h-full rounded-full bg-gradient-to-r from-[#7FB069] to-[#2F6B45] transition-all duration-500" style={{ width: `${(favCount / 5) * 100}%` }} />
        </div>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">{favCount} / 5 {need > 0 ? `· 还差 ${need} 个` : '· 即将解锁！'}</p>
        <Link href="/explore" className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ background: '#2F6B45' }}>去收藏提示词 →</Link>
      </div>
    )
  }

  const serial = String((favorites.length * 137 + persona.name.length * 911) % 9000 + 1000)
  const tags = analysis.topTags.slice(0, 4).map((t: any) => `#${t.name}`)

  return (
    <div className="space-y-6">
      {/* 预览卡片 */}
      <div ref={cardRef} className="mx-auto max-w-md overflow-hidden rounded-sm shadow-lg" style={{ background: `linear-gradient(180deg, ${C.bgTop}, ${C.bgBot})` }}>
        <div className="p-10">
          {/* 顶部双行 */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[12px] font-semibold" style={{ color: C.ink, letterSpacing: '0.15em' }}>CGFAN · 美学人格</div>
              <div className="text-[8px] font-medium" style={{ color: C.soft2, letterSpacing: '0.1em' }}>AESTHETIC PERSONALITY</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-semibold" style={{ color: C.ink, letterSpacing: '0.1em' }}>NO.{serial}</div>
              <div className="text-[8px] font-medium" style={{ color: C.soft2, letterSpacing: '0.08em' }}>探索你的美学光谱</div>
            </div>
          </div>

          {/* 左侧竖线 + 内容 */}
          <div className="mt-10 flex gap-5">
            <div className="w-[3px] flex-shrink-0" style={{ background: C.ink, minHeight: '200px' }} />
            <div className="flex-1">
              <div className="text-[11px] font-medium tracking-[0.4em]" style={{ color: C.soft }}>你 是</div>
              <h2 className="mt-2 font-serif font-black leading-tight" style={{
                fontSize: persona.name.length >= 6 ? '52px' : persona.name.length >= 5 ? '60px' : '70px',
                color: C.ink,
              }}>{persona.name}</h2>
              <div className="mt-1 text-[11px] font-semibold tracking-[0.42em]" style={{ color: C.ink }}>{persona.en}</div>
              <div className="mt-6 font-serif text-base font-medium" style={{ color: C.soft }}>
                「 {persona.tagline} 」
              </div>
            </div>
          </div>

          {/* 装饰短线 + 菱形 */}
          <div className="mt-6 mb-8 flex items-center gap-2">
            <div className="h-px w-14" style={{ background: C.lineSoft }} />
            <div className="h-1.5 w-1.5 rotate-45" style={{ background: C.lineSoft }} />
          </div>

          {/* 品味光谱 */}
          <div className="text-[10px] font-medium tracking-[0.3em]" style={{ color: C.soft }}>品 味 光 谱</div>
          {analysis.categories.slice(0, 3).map((cat: any) => (
            <div key={cat.name} className="mt-3 grid grid-cols-[72px_1fr_44px] items-center gap-3">
              <span className="text-[12px]" style={{ color: C.ink }}>{cat.name}</span>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: C.track }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.round(cat.ratio * 100)}%`,
                  background: persona.prismatic
                    ? 'linear-gradient(90deg, #FF4D6D, #F97316, #EAB308, #6A994E, #14B8A6, #00E5FF, #6B8CFF, #9B7EDE)'
                    : `linear-gradient(90deg, ${C.spectrum[0]}, ${C.spectrum[1]}, ${C.spectrum[2]}, ${C.spectrum[3]}, ${C.spectrum[4]}, ${C.spectrum[5]})`,
                }} />
              </div>
              <span className="text-right text-[11px] font-semibold tabular-nums" style={{ color: C.ink }}>{Math.round(cat.ratio * 100)}%</span>
            </div>
          ))}

          {/* 实心绿胶囊标签 */}
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <span key={tag} className="rounded-full px-3 py-1.5 text-[11px] font-medium" style={{
                background: C.pill,
                color: C.pillInk,
              }}>{tag}</span>
            ))}
          </div>

          {/* 底部：meta + 印章 */}
          <div className="mt-8 flex items-end justify-between">
            <div className="flex flex-col gap-1 text-[10px]" style={{ color: C.soft2 }}>
              <span>生成于 {new Date().toLocaleDateString('zh-CN')}</span>
              <span>www.cgfan.com/taste</span>
            </div>
            <div className="grid h-[52px] w-[52px] place-items-center rounded-full text-base font-black font-serif" style={{
              background: 'radial-gradient(circle at 40% 40%, #4F8F54, #2F6B45, #1B3A27)',
              color: '#16301F',
              transform: 'rotate(-6deg)',
              boxShadow: '0 0 0 2px rgba(180,220,150,0.3), inset 0 0 0 1px rgba(0,0,0,0.2)',
              textShadow: '0 1px 0 rgba(190,225,170,0.4)',
            }}>{persona.seal}</div>
          </div>
        </div>
      </div>

      <button onClick={handleDownload} disabled={isGenerating}
        className="mx-auto flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
        style={{ background: C.ink }}>
        {isGenerating ? (
          <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>生成中...</>
        ) : (
          <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>下载品味卡片</>
        )}
      </button>
      <div className="text-center text-xs" style={{ color: C.soft2 }}>
        收藏更多提示词后，重新访问本页即可更新匹配结果
      </div>
    </div>
  )
}