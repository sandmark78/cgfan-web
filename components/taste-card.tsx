'use client'

import { useState, useEffect } from 'react'
import { UserProfile, loadProfile, saveProfile, clearProfile, getGrowthStage, GROWTH_STAGES } from '@/lib/aesthetic-dynamic'
import { BASE_PERSONAS, BasePersona } from '@/lib/aesthetic-engine'
import { AestheticGrowthChart } from './aesthetic-growth-chart'
import { AestheticQuiz } from './aesthetic-quiz'

interface TasteCardClientProps {
  serverFavorites?: Array<{ slug: string; title: string; category: string; tags: string[]; model: string; cover: string }>
  isLoggedIn?: boolean
}

export function TasteCardClient({ serverFavorites, isLoggedIn }: TasteCardClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentPersona, setCurrentPersona] = useState<BasePersona | null>(null)
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    const saved = loadProfile()
    
    // 同步实际收藏数
    if (serverFavorites && serverFavorites.length > 0) {
      saved.favoriteCount = serverFavorites.length
      saveProfile(saved)
    } else {
      // 尝试从 localStorage 读取
      const localFavs = JSON.parse(localStorage.getItem('cgfan_favorites') || '[]')
      if (localFavs.length > 0) {
        saved.favoriteCount = localFavs.length
        saveProfile(saved)
      }
    }
    
    setProfile(saved)
    
    if (saved.currentPersonaId) {
      const persona = BASE_PERSONAS.find(p => p.id === saved.currentPersonaId)
      setCurrentPersona(persona || null)
    }
  }, [serverFavorites])

  const handleRetake = () => {
    clearProfile()
    localStorage.removeItem('cgfan_quiz_result')
    setProfile(null)
    setCurrentPersona(null)
    setShowRetakeConfirm(false)
    setShowQuiz(true)
  }

  // 显示测试组件
  if (showQuiz || !profile || !currentPersona) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <AestheticQuiz />
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
          onClick={() => setShowRetakeConfirm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          重新测试
        </button>
      </div>

      {/* 重新测试确认弹窗 */}
      {showRetakeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                确认重新测试？
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                这将清除你当前的美学人格数据，重新开始测试。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRetakeConfirm(false)}
                className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleRetake}
                className="flex-1 rounded-full bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                确认重新测试
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
