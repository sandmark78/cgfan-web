'use client'

import { useEffect, useState } from 'react'
import { AestheticVector, BASE_PERSONAS } from '@/lib/aesthetic-engine'
import { 
  UserProfile, 
  loadProfile, 
  saveProfile, 
  updateProfile, 
  getGrowthStage,
  getUnlockedFeatures,
  createEmptyProfile 
} from '@/lib/aesthetic-dynamic'
import { AestheticRadar } from './aesthetic-radar'

interface AestheticProfileProps {
  favorites: Array<{ slug: string; title: string; category: string; tags: string[]; model: string; cover: string }>
}

/**
 * 美学人格动态系统组件
 * 集成收藏功能，实时更新用户画像
 */
export function AestheticProfile({ favorites }: AestheticProfileProps) {
  const [profile, setProfile] = useState<UserProfile>(createEmptyProfile())
  const [showRadar, setShowRadar] = useState(false)

  // 加载用户画像
  useEffect(() => {
    const saved = loadProfile()
    setProfile(saved)
  }, [])

  // 监听收藏变化，更新画像
  useEffect(() => {
    if (favorites.length === 0) return

    // 检查是否有新的收藏
    const lastFavorite = favorites[favorites.length - 1]
    const lastHistory = profile.history[profile.history.length - 1]

    if (!lastHistory || lastHistory.slug !== lastFavorite.slug) {
      // 计算新收藏的8维向量
      const newVector = calculateVectorFromPrompt(lastFavorite)
      
      // 更新画像
      const result = updateProfile(profile, newVector, lastFavorite.slug)
      setProfile(result.profile)
      saveProfile(result.profile)

      // 显示阶段变化提示
      if (result.stageChanged && result.newStage) {
        console.log(`🎉 恭喜进入${result.newStage.name}阶段！`)
      }
    }
  }, [favorites])

  // 从提示词计算8维向量（简化版，基于分类和标签）
  const calculateVectorFromPrompt = (prompt: { category: string; tags: string[] }): AestheticVector => {
    const vector: AestheticVector = {
      complexity: 50,
      colorIntensity: 50,
      arousal: 50,
      fluency: 50,
      novelty: 50,
      harmony: 50,
      narrative: 50,
      stylization: 50,
    }

    // 基于分类调整
    switch (prompt.category) {
      case 'photography':
        vector.narrative += 20
        vector.colorIntensity += 10
        break
      case '3d':
        vector.complexity += 20
        vector.stylization += 15
        break
      case 'poster':
        vector.colorIntensity += 15
        vector.novelty += 10
        break
      case 'portrait':
        vector.narrative += 15
        vector.arousal += 10
        break
    }

    // 基于标签调整
    const tags = prompt.tags.map(t => t.toLowerCase())
    
    if (tags.some(t => t.includes('极简') || t.includes('minimal'))) {
      vector.complexity -= 20
      vector.fluency += 20
      vector.harmony += 15
    }
    
    if (tags.some(t => t.includes('赛博') || t.includes('cyber'))) {
      vector.colorIntensity += 20
      vector.novelty += 15
      vector.stylization += 20
    }
    
    if (tags.some(t => t.includes('东方') || t.includes('eastern'))) {
      vector.harmony += 20
      vector.narrative += 15
      vector.fluency += 10
    }
    
    if (tags.some(t => t.includes('复古') || t.includes('retro'))) {
      vector.novelty -= 15  // 复古不是新奇
      vector.narrative += 15  // 复古有故事感
      vector.stylization += 10  // 复古有特定风格
    }

    // 确保所有值在0-100范围内
    Object.keys(vector).forEach(key => {
      const k = key as keyof AestheticVector
      vector[k] = Math.max(0, Math.min(100, vector[k]))
    })

    return vector
  }

  const currentPersona = BASE_PERSONAS.find(p => p.id === profile.currentPersonaId)
  const currentStage = getGrowthStage(profile.favoriteCount)
  const unlockedFeatures = getUnlockedFeatures(profile.favoriteCount)

  if (!currentPersona) return null

  return (
    <div className="space-y-6">
      {/* 人格信息 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentPersona.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentPersona.en}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl">{currentStage.icon}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentStage.name}
            </div>
          </div>
        </div>
        
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          {currentPersona.tagline}
        </p>

        <div className="mb-4 flex gap-2">
          <div className="flex-1 rounded bg-gray-50 p-3 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">收藏数</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.favoriteCount}
            </div>
          </div>
          <div className="flex-1 rounded bg-gray-50 p-3 dark:bg-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">稳定性</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(profile.stability * 100)}%
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowRadar(!showRadar)}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
        >
          {showRadar ? '隐藏' : '查看'}8维雷达图
        </button>
      </div>

      {/* 8维雷达图 */}
      {showRadar && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            你的审美维度
          </h4>
          <AestheticRadar vector={profile.vector} size={300} />
        </div>
      )}

      {/* 成长阶段 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          成长阶段
        </h4>
        <div className="space-y-3">
          {['🌱 探索期', '🌿 形成期', '🌳 沉浸期', '🏆 策展期', '👑 大师期'].map((stage, i) => {
            const stageRange = [
              [0, 4],
              [5, 19],
              [20, 49],
              [50, 99],
              [100, Infinity]
            ][i]
            const isUnlocked = profile.favoriteCount >= stageRange[0]
            const isCurrent = profile.favoriteCount >= stageRange[0] && profile.favoriteCount <= stageRange[1]
            
            return (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  isCurrent
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : isUnlocked
                    ? 'bg-gray-50 dark:bg-gray-800'
                    : 'opacity-50'
                }`}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stage}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {isUnlocked ? '已解锁' : `${stageRange[0]}+ 收藏`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 已解锁功能 */}
      {unlockedFeatures.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            已解锁功能
          </h4>
          <div className="flex flex-wrap gap-2">
            {unlockedFeatures.map((feature, i) => (
              <span
                key={i}
                className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
