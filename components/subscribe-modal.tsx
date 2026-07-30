'use client'

import { useState } from 'react'

export default function SubscribeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [rssCopied, setRssCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setStatus('success')
        setEmail('')
        setTimeout(() => {
          onClose()
          setStatus('idle')
        }, 2000)
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
      console.error('Subscribe error:', error)
    }
  }

  const handleCopyRss = async () => {
    try {
      await navigator.clipboard.writeText('https://www.cgfan.com/daily/feed.xml')
      setRssCopied(true)
      setTimeout(() => setRssCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="关闭"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题 */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          订阅 CGfan
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          每天精选一个 AI 提示词，通过邮件或 RSS 订阅获取更新
        </p>

        {/* 邮件订阅表单 */}
        <form onSubmit={handleSubmit} className="mb-6">
          <label htmlFor="subscribe-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            邮件订阅
          </label>
          <div className="flex gap-2">
            <input
              id="subscribe-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              disabled={status === 'loading' || status === 'success'}
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success' || !email.trim()}
              className="btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '订阅中...' : status === 'success' ? '已订阅' : '订阅'}
            </button>
          </div>
          {status === 'success' && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ 订阅成功！我们会每天发送精选提示词
            </p>
          )}
          {status === 'error' && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              ✗ 订阅失败，请稍后重试
            </p>
          )}
        </form>

        {/* 分割线 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">或</span>
          </div>
        </div>

        {/* RSS 订阅 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            RSS 订阅
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
              /daily/feed.xml
            </div>
            <button
              onClick={handleCopyRss}
              className="btn-secondary px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              {rssCopied ? '已复制' : '复制链接'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            使用 RSS 阅读器（如 Feedly、Inoreader）订阅
          </p>
        </div>

        {/* 订阅说明 */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            订阅内容
          </h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              每日一味：每天一个精选 AI 提示词
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              策展笔记：专业解读和实用技巧
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              每周精选：本周最受欢迎的提示词合集
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
