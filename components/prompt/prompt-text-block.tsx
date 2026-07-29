'use client'

import { useState, useEffect } from 'react'

interface PromptTextBlockProps {
  text: string
  maxLines?: number
}
interface PromptTextBlockProps {
  text: string
  maxLines?: number
  showCopyButton?: boolean
}

/**
 * 提示词文本块 - 可折叠/展开，支持复制
 */
export function PromptTextBlock({ text, maxLines = 10, showCopyButton = true }: PromptTextBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const lineCount = text.split('\n').length
  // 移动端始终折叠，桌面端根据行数判断
  const shouldCollapse = isMobile || lineCount > maxLines

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="relative">
      {/* 复制按钮 */}
      {showCopyButton && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              copied
                ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                : 'bg-green-600 text-white hover:bg-green-500 shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-500/30 dark:bg-green-700 dark:hover:bg-green-600 dark:shadow-green-700/30'
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                一键复制
              </>
            )}
          </button>
        </div>
      )}

      {/* 文本区域 */}
      <div className="relative min-w-0">
        <pre
          className={`whitespace-pre-wrap max-w-full overflow-x-auto overflow-wrap-break-word word-break-break-word text-sm leading-relaxed text-gray-600 dark:text-gray-400 ${
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

