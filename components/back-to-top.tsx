'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

/**
 * 返回顶部按钮 - 滚动超过 400px 后显示
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top ${visible ? 'visible' : ''} flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95 dark:bg-emerald-500`}
      aria-label="返回顶部"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
