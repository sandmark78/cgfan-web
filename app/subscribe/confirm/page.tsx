'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (email) {
      // 调用确认 API
      fetch('/api/subscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.success ? 'success' : 'error')
        })
        .catch(() => {
          setStatus('error')
        })
    } else {
      setStatus('error')
    }
  }, [email])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              确认中...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              正在确认你的订阅
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              订阅成功！
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              感谢订阅 CGfan 每日一味
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              {email}
            </p>
            <a
              href="/"
              className="btn-primary inline-block px-6 py-3"
            >
              返回首页
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              确认失败
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              请稍后重试或联系管理员
            </p>
            <a
              href="/"
              className="btn-primary inline-block px-6 py-3"
            >
              返回首页
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
