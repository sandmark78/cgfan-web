'use client'

interface PromptDNAProps {
  dna?: {
    styles?: [string, number][]
    lighting?: [string, number][]
    composition?: [string, number][]
    material?: [string, number][]
  }
  metrics?: {
    complexity?: number
    reproducibility?: number
  }
  recommendedModels?: {
    model: string
    level: string
    score: number
  }[]
}

export function PromptDNA({ dna, metrics, recommendedModels }: PromptDNAProps) {
  // 检查是否有实际内容可展示
  const hasStyles = dna?.styles && dna.styles.length > 0
  const hasLighting = dna?.lighting && dna.lighting.length > 0
  const hasComposition = dna?.composition && dna.composition.length > 0
  const hasMaterial = dna?.material && dna.material.length > 0
  const hasModels = recommendedModels && recommendedModels.length > 0
  const hasMetrics = metrics && (metrics.complexity !== undefined || metrics.reproducibility !== undefined)
  
  // 没有任何内容可展示时不渲染
  if (!hasStyles && !hasLighting && !hasComposition && !hasMaterial && !hasModels && !hasMetrics) return null

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Prompt DNA
      </h3>

      {/* 风格特征 */}
      {dna?.styles && dna.styles.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">风格特征</div>
          <div className="space-y-2">
            {dna.styles.map(([style, score]) => (
              <div key={style} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 w-20">{style}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 光线特征 */}
      {dna?.lighting && dna.lighting.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">光线</div>
          <div className="flex flex-wrap gap-2">
            {dna.lighting.map(([lighting, score]) => (
              <span
                key={lighting}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs text-amber-700 dark:text-amber-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {lighting}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 构图特征 */}
      {dna?.composition && dna.composition.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">构图</div>
          <div className="flex flex-wrap gap-2">
            {dna.composition.map(([comp, score]) => (
              <span
                key={comp}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs text-blue-700 dark:text-blue-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 材质特征 */}
      {dna?.material && dna.material.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">材质</div>
          <div className="flex flex-wrap gap-2">
            {dna.material.map(([material, score]) => (
              <span
                key={material}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs text-purple-700 dark:text-purple-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {material}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 复杂度指标 */}
      {metrics && (
        <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">复杂度指标</div>
          <div className="grid grid-cols-2 gap-4">
            {metrics.complexity !== undefined && (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">复杂度</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= metrics.complexity!
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  ))}
                </div>
              </div>
            )}
            {metrics.reproducibility !== undefined && (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">复现难度</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= metrics.reproducibility!
                          ? 'text-orange-500 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 推荐模型 */}
      {recommendedModels && recommendedModels.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">推荐模型</div>
          <div className="space-y-2">
            {recommendedModels.map(({ model, level, score }) => (
              <div key={model} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{model}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    level === '非常适合'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : level === '适合'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
