'use client'

import { UserProfile } from '@/lib/aesthetic-dynamic'

interface AestheticGrowthChartProps {
  profile: UserProfile
}

export function AestheticGrowthChart({ profile }: AestheticGrowthChartProps) {
  const { history } = profile
  
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
    { key: 'complexity', label: '复杂度', color: '#059669' },      // emerald-600
    { key: 'colorIntensity', label: '色彩强度', color: '#10b981' }, // emerald-500
    { key: 'arousal', label: '情绪唤醒', color: '#34d399' },        // emerald-400
    { key: 'fluency', label: '处理流畅', color: '#6ee7b7' },        // emerald-300
    { key: 'novelty', label: '新奇性', color: '#14b8a6' },          // teal-500
    { key: 'harmony', label: '和谐度', color: '#2dd4bf' },          // teal-400
    { key: 'narrative', label: '叙事性', color: '#0d9488' },        // teal-600
    { key: 'stylization', label: '风格化', color: '#0f766e' },      // teal-700
  ] as const

  // 计算图表参数
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const width = 800
  const height = 300
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // X 轴：收藏次数（索引）
  const xScale = (i: number) => padding.left + (i / (history.length - 1)) * chartWidth
  
  // Y 轴：0-100
  const yScale = (v: number) => padding.top + chartHeight - (v / 100) * chartHeight

  // 生成平滑贝塞尔曲线路径
  const generateSmoothPath = (dimKey: keyof typeof history[0]['vector']) => {
    const points = history.map((h, i) => ({
      x: xScale(i),
      y: yScale(h.vector[dimKey]),
    }))
    
    if (points.length < 2) return ''
    
    let path = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]
      
      // 控制点计算（平滑曲线）
      const cp1x = prev.x + (curr.x - prev.x) / 3
      const cp1y = prev.y + (curr.y - prev.y) / 3
      
      const cp2x = curr.x - (next ? (next.x - prev.x) / 6 : (curr.x - prev.x) / 3)
      const cp2y = curr.y - (next ? (next.y - prev.y) / 6 : (curr.y - prev.y) / 3)
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
    
    return path
  }

  // 生成面积填充路径
  const generateAreaPath = (dimKey: keyof typeof history[0]['vector']) => {
    const linePath = generateSmoothPath(dimKey)
    const lastX = xScale(history.length - 1)
    const firstX = xScale(0)
    const bottomY = yScale(0)
    
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          审美成长曲线
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {history.length} 次收藏
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={height} className="min-w-[600px]">
          {/* 定义渐变 */}
          <defs>
            {dimensions.map((dim, i) => (
              <linearGradient key={dim.key} id={`gradient-${dim.key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={dim.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={dim.color} stopOpacity="0.05" />
              </linearGradient>
            ))}
          </defs>

          {/* 网格线 - 毛玻璃效果 */}
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

          {/* 面积填充（渐变） */}
          {dimensions.map(dim => (
            <path
              key={`area-${dim.key}`}
              d={generateAreaPath(dim.key)}
              fill={`url(#gradient-${dim.key})`}
              className="transition-all duration-500"
            />
          ))}

          {/* 平滑曲线 */}
          {dimensions.map(dim => (
            <path
              key={dim.key}
              d={generateSmoothPath(dim.key)}
              fill="none"
              stroke={dim.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
              opacity={0.8}
            />
          ))}

          {/* 数据点 */}
          {dimensions.map(dim =>
            history.map((h, i) => (
              <circle
                key={`${dim.key}-${i}`}
                cx={xScale(i)}
                cy={yScale(h.vector[dim.key])}
                r={i === history.length - 1 ? 4 : 2}
                fill={dim.color}
                className="transition-all duration-500"
                opacity={i === history.length - 1 ? 1 : 0.6}
              />
            ))
          )}
        </svg>
      </div>

      {/* 图例 - 毛玻璃效果 */}
      <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-white/20 p-3 backdrop-blur-sm dark:bg-white/5">
        {dimensions.map(dim => (
          <div key={dim.key} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full shadow-sm"
              style={{ backgroundColor: dim.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {dim.label}
            </span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {Math.round(profile.vector[dim.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
