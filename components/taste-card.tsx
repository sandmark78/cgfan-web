'use client'

import { useState, useEffect } from 'react'
import { UserProfile, loadProfile, clearProfile, getGrowthStage, GROWTH_STAGES } from '@/lib/aesthetic-dynamic'
import { BASE_PERSONAS, BasePersona } from '@/lib/aesthetic-engine'
import { AestheticGrowthChart } from './aesthetic-growth-chart'

interface TasteCardClientProps {
  serverFavorites?: Array<{ slug: string; title: string; category: string; tags: string[]; model: string; cover: string }>
  isLoggedIn?: boolean
}

export function TasteCardClient({ serverFavorites, isLoggedIn }: TasteCardClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentPersona, setCurrentPersona] = useState<BasePersona | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    const saved = loadProfile()
    setProfile(saved)
    
    if (saved.currentPersonaId) {
      const persona = BASE_PERSONAS.find(p => p.id === saved.currentPersonaId)
      setCurrentPersona(persona || null)
    }
  }, [])

  const handleClearData = () => {
    clearProfile()
    setProfile(null)
    setCurrentPersona(null)
    setShowClearConfirm(false)
    window.location.reload()
  }

  // 未开始状态
  if (!profile || !currentPersona) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 text-6xl">🎨</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          开始你的美学之旅
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          完成 4 道测试题，发现你的初始美学人格
        </p>
        <a
          href="/taste/quiz"
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          开始测试
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    )
  }

  const stage = getGrowthStage(profile.favoriteCount)
  const nextStage = GROWTH_STAGES.find(s => s.range[0] > profile.favoriteCount)
  const progress = nextStage
    ? ((profile.favoriteCount - stage.range[0]) / (nextStage.range[0] - stage.range[0])) * 100
    : 100

  return (
    <div className="space-y-6">
      {/* 人格卡片 */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-gray-800 dark:from-green-950 dark:to-emerald-950">
        <div className="p-8">
          {/* 头部 */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-3xl">{stage.icon}</span>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  {stage.name}
                </span>
              </div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 dark:text-white">
                {currentPersona.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {currentPersona.en}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {profile.favoriteCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                收藏数
              </div>
            </div>
          </div>

          {/* 签名 */}
          <blockquote className="mb-6 border-l-4 border-green-600 pl-4 font-serif text-lg italic text-gray-700 dark:text-gray-300">
            {currentPersona.tagline}
          </blockquote>

          {/* 描述 */}
          <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {currentPersona.description}
          </p>

          {/* 成长进度 */}
          {nextStage && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  距离 {nextStage.icon} {nextStage.name} 还需 {nextStage.range[0] - profile.favoriteCount} 次收藏
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 8维数据 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(profile.vector).map(([key, value]) => {
              const labels: Record<string, string> = {
                complexity: '复杂度',
                colorIntensity: '色彩强度',
                arousal: '情绪唤醒',
                fluency: '处理流畅',
                novelty: '新奇性',
                harmony: '和谐度',
                narrative: '叙事性',
                stylization: '风格化',
              }
              return (
                <div key={key} className="rounded-lg bg-white/60 p-3 dark:bg-gray-800/60">
                  <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    {labels[key]}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(value)}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 成长曲线 */}
      <AestheticGrowthChart profile={profile} />

      {/* 操作按钮 */}
      <div className="flex justify-center gap-4">
        <a
          href="/explore"
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          继续收藏
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          重新测试
        </button>
      </div>

      {/* 清除确认对话框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              确认重新测试？
            </h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              这将清除你当前的美学人格数据和收藏历史，重新开始测试。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
