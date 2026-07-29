'use client'

import { AestheticVector } from '@/lib/aesthetic-engine'

interface AestheticRadarProps {
  vector: AestheticVector
  size?: number
  showLabels?: boolean
  className?: string
}

/**
 * 8维美学雷达图组件
 * 可视化展示用户的审美偏好分布
 */
export function AestheticRadar({ 
  vector, 
  size = 300, 
  showLabels = true,
  className = '' 
}: AestheticRadarProps) {
  const center = size / 2
  const radius = size * 0.35
  const levels = 5 // 同心圆层数
  
  // 8个维度的配置
  const dimensions = [
    { key: 'complexity', label: '复杂度', angle: -90 },
    { key: 'colorIntensity', label: '色彩强度', angle: -45 },
    { key: 'arousal', label: '情绪唤醒', angle: 0 },
    { key: 'fluency', label: '处理流畅', angle: 45 },
    { key: 'novelty', label: '新奇性', angle: 90 },
    { key: 'harmony', label: '和谐度', angle: 135 },
    { key: 'narrative', label: '叙事性', angle: 180 },
    { key: 'stylization', label: '风格化', angle: 225 },
  ] as const

  // 计算多边形顶点
  const getPoint = (angle: number, value: number) => {
    const rad = (angle * Math.PI) / 180
    const distance = (value / 100) * radius
    return {
      x: center + distance * Math.cos(rad),
      y: center + distance * Math.sin(rad),
    }
  }

  // 生成数据多边形路径
  const dataPoints = dimensions.map(dim => 
    getPoint(dim.angle, vector[dim.key])
  )
  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ') + ' Z'

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* 背景同心圆 */}
        {Array.from({ length: levels }, (_, i) => {
          const r = (radius / levels) * (i + 1)
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={i === levels - 1 ? 1.5 : 0.5}
              className="text-gray-300 dark:text-gray-600"
              opacity={0.5}
            />
          )
        })}

        {/* 辐射线 */}
        {dimensions.map((dim, i) => {
          const point = getPoint(dim.angle, 100)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-gray-300 dark:text-gray-600"
              opacity={0.5}
            />
          )
        })}

        {/* 数据多边形 */}
        <path
          d={dataPath}
          fill="url(#radarGradient)"
          stroke="currentColor"
          strokeWidth={2}
          className="text-green-600 dark:text-green-400"
          opacity={0.8}
        />

        {/* 渐变定义 */}
        <defs>
          <radialGradient id="radarGradient">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.3} className="text-green-600 dark:text-green-400" />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0.1} className="text-green-600 dark:text-green-400" />
          </radialGradient>
        </defs>

        {/* 数据点 */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="currentColor"
            className="text-green-600 dark:text-green-400"
          />
        ))}

        {/* 标签 */}
        {showLabels && dimensions.map((dim, i) => {
          const labelPoint = getPoint(dim.angle, 120)
          const value = vector[dim.key]
          
          return (
            <g key={i}>
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-700 dark:fill-gray-300 text-xs font-medium"
              >
                {dim.label}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-green-600 dark:fill-green-400 text-xs font-bold"
              >
                {Math.round(value)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
