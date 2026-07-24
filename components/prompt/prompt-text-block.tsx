'use client'

import { useState } from 'react'

interface PromptTextBlockProps {
  text: string
  maxLines?: number
}

/**
 * 可折叠的提示词文本块 - 长文本默认折叠，支持展开/收起
 */
export function PromptTextBlock({ text, maxLines = 15 }: PromptTextBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const lineCount = text.split('\n').length
  const shouldCollapse = lineCount > maxLines

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 估算阅读时间（中文约 300字/分钟）
  const charCount = text.length
  const readTime = Math.max(1, Math.ceil(charCount / 300))

  return (
    <div className="relative">
      {/* 顶部工具栏 */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{charCount.toLocaleString()} 字符 · 约 {readTime} 分钟</span>
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
            copied
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          {copied ? (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              已复制
            </>
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制
            </>
          )}
        </button>
      </div>

      {/* 文本区域 */}
      <div className="relative">
        <pre
          className={`whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400 ${
            shouldCollapse && !isExpanded ? `line-clamp-[${maxLines}]` : ''
          }`}
          style={shouldCollapse && !isExpanded ? { display: '-webkit-box', WebkitLineClamp: maxLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
        >
          {text}
        </pre>

        {/* 折叠渐变遮罩 */}
        {shouldCollapse && !isExpanded && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80" />
        )}
      </div>

      {/* 展开/收起按钮 */}
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          {isExpanded ? (
            <>
              收起
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              展开全部 ({lineCount} 行)
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  )
}

