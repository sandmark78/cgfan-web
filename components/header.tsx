'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * 顶部导航栏 - 毛玻璃效果
 */
export default function Header() {
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-6xl px-3 sm:px-4">
      <nav className="glass flex items-center justify-between rounded-full px-3 sm:px-6 py-2 sm:py-3 overflow-hidden">
        {/* Logo - 衬线体 */}
        <Link href="/" className="font-serif text-lg sm:text-2xl italic font-bold text-gray-900 dark:text-white">
          CGfan.com
        </Link>

        {/* 搜索框 */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="搜索提示词..."
              className="w-full rounded-full border border-gray-200 bg-white/50 px-4 py-2 pl-10 text-sm outline-none backdrop-blur-sm transition-all focus:border-green-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:border-green-400"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 暗色模式切换 */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-1.5 sm:p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="切换主题"
          >
            {isDark ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* 登录按钮 */}
          <Link
            href="/login"
            className="btn-primary text-xs px-3 py-1.5"
          >
            登录
          </Link>

          {/* 菜单按钮 */}
          <button className="rounded-full p-1.5 sm:p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-4 w-4 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
