'use client'

import { useState } from 'react'

export default function SubscribePageClient() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [rssCopied, setRssCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      // TODO: 集成邮件订阅服务（如 Mailchimp、ConvertKit 等）
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStatus('success')
      setEmail('')
    } catch (error) {
      setStatus('error')
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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            订阅 CGfan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            每天精选一个 AI 提示词，通过邮件或 RSS 订阅获取更新
          </p>
        </div>

        {/* 邮件订阅卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                邮件订阅
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                每天收到精选提示词推送
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subscribe-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱地址
              </label>
              <input
                id="subscribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                disabled={status === 'loading' || status === 'success'}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success' || !email.trim()}
              className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '订阅中...' : status === 'success' ? '✓ 已订阅' : '立即订阅'}
            </button>
            {status === 'success' && (
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                订阅成功！我们会每天发送精选提示词到您的邮箱
              </p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                订阅失败，请稍后重试
              </p>
            )}
          </form>
        </div>

        {/* RSS 订阅卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                RSS 订阅
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                使用 RSS 阅读器订阅
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono truncate">
                https://www.cgfan.com/daily/feed.xml
              </div>
              <button
                onClick={handleCopyRss}
                className="btn-secondary px-6 py-3 text-sm font-medium whitespace-nowrap"
              >
                {rssCopied ? '✓ 已复制' : '复制链接'}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              推荐使用 Feedly、Inoreader 或 NetNewsWire 等 RSS 阅读器
            </p>
          </div>
        </div>

        {/* 订阅内容说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            订阅内容
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">每日一味</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  每天一个精选 AI 提示词，附策展笔记和实用技巧
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">策展笔记</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  专业解读提示词的设计思路和使用方法
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">每周精选</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  本周最受欢迎的提示词合集，周末推送
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
              我们尊重您的隐私，不会分享您的邮箱地址
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
