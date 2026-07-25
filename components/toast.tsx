'use client'

import { useState, useEffect, createContext, useContext } from 'react'

interface Toast {
  id: number
  message: string
  icon?: string
}

const ToastContext = createContext<{ show: (msg: string, icon?: string) => void }>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = (message: string, icon = '✓') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, icon }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2000)
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="animate-slide-up rounded-xl bg-green-800/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm"
          >
            <span className="mr-2">{t.icon}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}