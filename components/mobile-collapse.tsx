'use client'

import { useState } from 'react'

export function MobileCollapse({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}>
        {children}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"
      >
        {open ? '收起' : '展开策展笔记'}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      </button>
    </div>
  )
}