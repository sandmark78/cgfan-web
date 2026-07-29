'use client'

import { UserProfile } from '@/lib/aesthetic-dynamic'

interface AestheticGrowthChartProps {
  profile: UserProfile
  height?: number
}

/**
 * 美学人格成长曲线组件
 * 展示用户 8 维审美偏好的历史演变
 */
export function AestheticGrowthChart({ profile, height = 300 }: AestheticGrowthChartProps) {
  const { history } = profile
  
  if (history.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          收藏 2 个以上提示词后，这里会显示你的审美成长曲线
        </p>
      </div>
    )
  }

  // 8 个维度的配置
  const dimensions = [
    { key: 'complexity', label: '复杂度', color: '#ef4444' },
    { key: 'colorIntensity', label: '色彩强度', color: '#f97316' },
    { key: 'arousal', label: '情绪唤醒', color: '#eab308' },
    { key: 'fluency', label: '处理流畅', color: '#84cc16' },
    { key: 'novelty', label: '新奇性', color: '#06b6d4' },
    { key: 'harmony', label: '和谐度', color: '#3b82f6' },
    { key: 'narrative', label: '叙事性', color: '#8b5cf6' },
    { key: 'stylization', label: '风格化', color: '#ec4899' },
  ] as const

  // 计算图表参数
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const width = 800
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // X 轴：收藏次数（索引）
  const xScale = (i: number) => padding.left + (i / (history.length - 1)) * chartWidth
  
  // Y 轴：0-100
  const yScale = (v: number) => padding.top + chartHeight - (v / 100) * chartHeight

  // 生成路径
  const generatePath = (dimKey: keyof typeof history[0]['vector']) => {
    return history
      .map((h, i) => {
        const x = xScale(i)
        const y = yScale(h.vector[dimKey])
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  // 生成面积路径
  const generateAreaPath = (dimKey: keyof typeof history[0]['vector']) => {
    const linePath = history.map((h, i) => {
      const x = xScale(i)
      const y = yScale(h.vector[dimKey])
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    
    const lastX = xScale(history.length - 1)
    const firstX = xScale(0)
    const bottomY = yScale(0)
    
    return `${linePath.join(' ')} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
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
                className="text-gray-200 dark:text-gray-800"
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

          {/* 面积填充（半透明） */}
          {dimensions.map(dim => (
            <path
              key={`area-${dim.key}`}
              d={generateAreaPath(dim.key)}
              fill={dim.color}
              opacity={0.05}
              className="transition-all duration-500"
            />
          ))}

          {/* 曲线 */}
          {dimensions.map(dim => (
            <path
              key={dim.key}
              d={generatePath(dim.key)}
              fill="none"
              stroke={dim.color}
              strokeWidth={2}
              className="transition-all duration-500"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              />
            ))
          )}
        </svg>
      </div>

      {/* 图例 */}
      <div className="mt-4 flex flex-wrap gap-4">
        {dimensions.map(dim => (
          <div key={dim.key} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
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
