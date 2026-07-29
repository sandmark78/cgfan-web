'use client'

import { useState } from 'react'
import { UserProfile } from '@/lib/aesthetic-dynamic'

interface AestheticGrowthChartProps {
  profile: UserProfile
}

export function AestheticGrowthChart({ profile }: AestheticGrowthChartProps) {
  const { history } = profile
  const [showDetails, setShowDetails] = useState(false)
  
  if (history.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          收藏 2 个以上提示词后，这里会显示你的审美成长曲线
        </p>
      </div>
    )
  }

  // 8 个维度的配置 - 绿色系配色
  const dimensions = [
    { key: 'complexity', label: '复杂度', color: '#059669', group: '视觉' },
    { key: 'colorIntensity', label: '色彩强度', color: '#10b981', group: '视觉' },
    { key: 'fluency', label: '处理流畅', color: '#34d399', group: '视觉' },
    { key: 'arousal', label: '情绪唤醒', color: '#14b8a6', group: '情感' },
    { key: 'narrative', label: '叙事性', color: '#2dd4bf', group: '情感' },
    { key: 'harmony', label: '和谐度', color: '#0d9488', group: '情感' },
    { key: 'novelty', label: '新奇性', color: '#0f766e', group: '风格' },
    { key: 'stylization', label: '风格化', color: '#115e59', group: '风格' },
  ] as const

  // 计算图表参数
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const width = 800
  const height = 300
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const xScale = (i: number) => padding.left + (i / (history.length - 1)) * chartWidth
  const yScale = (v: number) => padding.top + chartHeight - (v / 100) * chartHeight

  // 计算平均值曲线
  const avgHistory = history.map(h => {
    const values = dimensions.map(d => h.vector[d.key as keyof typeof h.vector])
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    return { vector: { avg } }
  })

  // 生成平滑贝塞尔曲线路径
  const generateSmoothPath = (data: any[], key: string) => {
    const points = data.map((h, i) => ({
      x: xScale(i),
      y: yScale(h.vector[key] || 0),
    }))
    
    if (points.length < 2) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]
      
      const cp1x = prev.x + (curr.x - prev.x) / 3
      const cp1y = prev.y + (curr.y - prev.y) / 3
      
      const cp2x = curr.x - (next ? (next.x - prev.x) / 6 : (curr.x - prev.x) / 3)
      const cp2y = curr.y - (next ? (next.y - prev.y) / 6 : (curr.y - prev.y) / 3)
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
    
    return path
  }

  const generateAreaPath = (data: typeof history | typeof avgHistory, key: string) => {
    const linePath = generateSmoothPath(data, key)
    const lastX = xScale(data.length - 1)
    const firstX = xScale(0)
    const bottomY = yScale(0)
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  // 计算趋势（上升/下降/稳定）
  const getTrend = (key: keyof typeof history[0]['vector']) => {
    if (history.length < 3) return 'stable'
    const recent = history.slice(-3)
    const values = recent.map(h => h.vector[key])
    const diff = values[2] - values[0]
    if (diff > 5) return 'up'
    if (diff < -5) return 'down'
    return 'stable'
  }

  const trendIcon = (trend: string) => {
    if (trend === 'up') return '↑'
    if (trend === 'down') return '↓'
    return '→'
  }

  const trendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400'
    if (trend === 'down') return 'text-red-600 dark:text-red-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          审美成长曲线
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {history.length} 次收藏
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm transition-colors hover:bg-white/30 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
          >
            {showDetails ? '收起详情' : '查看详情'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={height} className="min-w-[600px]">
          <defs>
            <linearGradient id="gradient-avg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            {dimensions.map((dim) => (
              <linearGradient key={dim.key} id={`gradient-${dim.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={dim.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={dim.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {/* 网格线 */}
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line
                x1={padding.left}
                y1={yScale(v)}
                x2={width - padding.right}
                y2={yScale(v)}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-gray-300/30 dark:text-gray-600/30"
              />
              <text
                x={padding.left - 8}
                y={yScale(v)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-gray-400 text-xs"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X 轴标签 */}
          {history.map((_, i) => {
            if (i % Math.ceil(history.length / 10) !== 0 && i !== history.length - 1) return null
            return (
              <text
                key={i}
                x={xScale(i)}
                y={height - 10}
                textAnchor="middle"
                className="fill-gray-400 text-xs"
              >
                {i + 1}
              </text>
            )
          })}

          {/* 默认视图：平均值曲线 */}
          {!showDetails && (
            <>
              <path
                d={generateAreaPath(avgHistory, 'avg')}
                fill="url(#gradient-avg)"
                className="transition-all duration-500"
              />
              <path
                d={generateSmoothPath(avgHistory, 'avg')}
                fill="none"
                stroke="#10b981"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
              {avgHistory.map((h, i) => (
                <circle
                  key={i}
                  cx={xScale(i)}
                  cy={yScale(h.vector.avg)}
                  r={i === avgHistory.length - 1 ? 5 : 2}
                  fill="#10b981"
                  className="transition-all duration-500"
                  opacity={i === avgHistory.length - 1 ? 1 : 0.6}
                />
              ))}
            </>
          )}

          {/* 详细视图：8个维度 */}
          {showDetails && dimensions.map(dim => (
            <g key={dim.key}>
              <path
                d={generateAreaPath(history, dim.key)}
                fill={`url(#gradient-${dim.key})`}
                className="transition-all duration-500"
              />
              <path
                d={generateSmoothPath(history, dim.key)}
                fill="none"
                stroke={dim.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
                opacity={0.7}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* 维度指标卡片 */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {dimensions.map(dim => {
          const trend = getTrend(dim.key)
          const currentValue = Math.round(profile.vector[dim.key])
          return (
            <div
              key={dim.key}
              className="rounded-xl bg-white/20 p-3 backdrop-blur-sm dark:bg-white/5"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {dim.label}
                </span>
                <span className={`text-xs font-bold ${trendColor(trend)}`}>
                  {trendIcon(trend)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentValue}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200/50 dark:bg-gray-700/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${currentValue}%`,
                    backgroundColor: dim.color 
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
