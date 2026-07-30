/**
 * 美学人格系统 v2.0 - 动态系统
 * 整合 personas.ts（36人格）+ aesthetic-engine.ts（8维算法）
 * EMA动态更新、稳定性计算、进化机制、成长阶段
 */

import { 
  AestheticVector, 
  cosineSimilarity 
} from './aesthetic-engine'
import {
  Persona,
  BASE_PERSONAS,
  DEEP_PERSONAS,
  EVOLUTION_MAP,
} from './personas'

// ═══════════════════════════════════════════════════════════════
// 1. 用户画像数据结构
// ═══════════════════════════════════════════════════════════════

export interface UserProfile {
  /** 用户当前8维向量 */
  vector: AestheticVector
  /** 稳定性指标 (0-1)，越高越稳定 */
  stability: number
  /** 当前匹配的人格ID（基础或深度） */
  currentPersonaId: string
  /** 收藏数量 */
  favoriteCount: number
  /** 是否已完成初始测试 */
  hasCompletedQuiz: boolean
  /** 最后更新时间戳 */
  lastUpdated: number
  /** 收藏历史（用于调试和分析） */
  history: Array<{
    slug: string
    vector: AestheticVector
    timestamp: number
  }>
}

/**
 * 创建空的用户画像
 */
export function createEmptyProfile(): UserProfile {
  return {
    vector: {
      complexity: 50,
      colorIntensity: 50,
      arousal: 50,
      fluency: 50,
      novelty: 50,
      harmony: 50,
      narrative: 50,
      stylization: 50,
    },
    stability: 0,
    currentPersonaId: 'eclectic',
    favoriteCount: 0,
    hasCompletedQuiz: false,
    lastUpdated: Date.now(),
    history: []
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. EMA 动态更新算法
// ═══════════════════════════════════════════════════════════════

/**
 * 计算学习率 alpha
 * 收藏越多，学习率越低（越稳定）
 */
export function calculateLearningRate(favoriteCount: number): number {
  return Math.max(0.1, 1 / Math.sqrt(favoriteCount + 1))
}

/**
 * 指数移动平均（EMA）更新用户向量
 */
export function emaUpdate(
  oldVector: AestheticVector,
  newData: AestheticVector,
  alpha: number
): AestheticVector {
  const keys = Object.keys(oldVector) as (keyof AestheticVector)[]
  const result = { ...oldVector }
  
  for (const key of keys) {
    result[key] = oldVector[key] * (1 - alpha) + newData[key] * alpha
  }
  
  return result
}

// ═══════════════════════════════════════════════════════════════
// 3. 稳定性计算
// ═══════════════════════════════════════════════════════════════

/**
 * 计算向量变化的平均幅度
 */
export function calculateVectorChange(
  oldVector: AestheticVector,
  newVector: AestheticVector
): number {
  const keys = Object.keys(oldVector) as (keyof AestheticVector)[]
  let totalChange = 0
  
  for (const key of keys) {
    totalChange += Math.abs(newVector[key] - oldVector[key])
  }
  
  return totalChange / keys.length
}

/**
 * 计算稳定性指标
 */
export function calculateStability(change: number): number {
  return Math.max(0, Math.min(1, 1 - change / 100))
}

// ═══════════════════════════════════════════════════════════════
// 4. 人格匹配（整合 8 维向量 + 收藏标签）
// ═══════════════════════════════════════════════════════════════

/**
 * 用 8 维向量匹配最相似的基础人格
 */
export function matchBasePersonaByVector(userVector: AestheticVector): Persona {
  let bestMatch = BASE_PERSONAS[0]
  let bestSimilarity = 0
  
  for (const persona of BASE_PERSONAS) {
    if (!persona.vector) continue
    const similarity = cosineSimilarity(userVector, persona.vector)
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = persona
    }
  }
  
  return bestMatch
}

/**
 * 用 8 维向量匹配最相似的深度人格
 * 只从当前基础人格的进化分支中选择
 */
export function matchDeepPersonaByVector(
  userVector: AestheticVector,
  basePersonaId: string
): Persona | null {
  const evolutionTargets = EVOLUTION_MAP[basePersonaId]
  if (!evolutionTargets) return null
  
  const deepTargets = DEEP_PERSONAS.filter(p => evolutionTargets.includes(p.id))
  
  let bestMatch: Persona | null = null
  let bestSimilarity = 0
  
  for (const persona of deepTargets) {
    if (!persona.vector) continue
    const similarity = cosineSimilarity(userVector, persona.vector)
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = persona
    }
  }
  
  return bestMatch
}

// ═══════════════════════════════════════════════════════════════
// 5. 进化系统
// ═══════════════════════════════════════════════════════════════

/**
 * 检查是否可以进化
 * 条件：收藏≥20 + 稳定性≥0.7
 */
export function canEvolve(profile: UserProfile): boolean {
  return profile.favoriteCount >= 20 && profile.stability >= 0.7
}

/**
 * 检查是否应该进化到深度人格
 * 返回进化后的深度人格ID，不需要进化返回null
 */
export function checkEvolution(profile: UserProfile): string | null {
  if (!canEvolve(profile)) return null
  
  const currentPersona = [...BASE_PERSONAS, ...DEEP_PERSONAS].find(p => p.id === profile.currentPersonaId)
  if (!currentPersona) return null
  
  // 如果已经是深度人格，检查是否应该换到同基础的其他深度
  if (currentPersona.deep) {
    const baseId = currentPersona.evolvesFrom
    if (!baseId) return null
    
    const deepMatch = matchDeepPersonaByVector(profile.vector, baseId)
    if (deepMatch && deepMatch.id !== profile.currentPersonaId) {
      // 只有新匹配的深度人格相似度明显更高才切换
      const currentSim = currentPersona.vector 
        ? cosineSimilarity(profile.vector, currentPersona.vector) 
        : 0
      const newSim = deepMatch.vector 
        ? cosineSimilarity(profile.vector, deepMatch.vector) 
        : 0
      
      if (newSim > currentSim + 0.05) {
        return deepMatch.id
      }
    }
    return null
  }
  
  // 基础人格 → 尝试进化到深度人格
  const deepMatch = matchDeepPersonaByVector(profile.vector, currentPersona.id)
  if (deepMatch) {
    const currentSim = currentPersona.vector 
      ? cosineSimilarity(profile.vector, currentPersona.vector) 
      : 0
    const deepSim = deepMatch.vector 
      ? cosineSimilarity(profile.vector, deepMatch.vector) 
      : 0
    
    // 深度人格匹配度更高，触发进化
    if (deepSim > currentSim) {
      return deepMatch.id
    }
  }
  
  return null
}

/**
 * 纠正机制：当用户向量与当前人格相似度 < 0.6 时，重新匹配
 */
export function checkCorrection(profile: UserProfile): string | null {
  const allPersonas = [...BASE_PERSONAS, ...DEEP_PERSONAS]
  const currentPersona = allPersonas.find(p => p.id === profile.currentPersonaId)
  if (!currentPersona?.vector) return null
  
  const similarity = cosineSimilarity(profile.vector, currentPersona.vector)
  
  if (similarity < 0.6) {
    // 如果已经可以进化，在深度人格里找
    if (canEvolve(profile)) {
      const baseId = currentPersona.deep ? currentPersona.evolvesFrom! : currentPersona.id
      const deepMatch = matchDeepPersonaByVector(profile.vector, baseId)
      if (deepMatch) return deepMatch.id
    }
    
    // 否则在基础人格里找
    const baseMatch = matchBasePersonaByVector(profile.vector)
    if (baseMatch.id !== profile.currentPersonaId) {
      return baseMatch.id
    }
  }
  
  return null
}

// ═══════════════════════════════════════════════════════════════
// 6. 成长阶段系统
// ═══════════════════════════════════════════════════════════════

export interface GrowthStage {
  name: string
  icon: string
  range: [number, number]
  description: string
  features: string[]
}

export const GROWTH_STAGES: GrowthStage[] = [
  {
    name: '探索期',
    icon: '🌱',
    range: [0, 4],
    description: '开始发现你的审美偏好',
    features: ['初始人格', '基础测试']
  },
  {
    name: '形成期',
    icon: '🌿',
    range: [5, 19],
    description: '审美画像逐渐清晰',
    features: ['品味光谱', '分类偏好', '动态更新']
  },
  {
    name: '沉浸期',
    icon: '🌳',
    range: [20, 49],
    description: '深度人格解锁',
    features: ['深度人格', '进化提示', '8维雷达图']
  },
  {
    name: '策展期',
    icon: '🏆',
    range: [50, 99],
    description: '审美体系成熟',
    features: ['策展人认证', '审美报告', '个性化推荐']
  },
  {
    name: '大师期',
    icon: '👑',
    range: [100, Infinity],
    description: '完整审美画像',
    features: ['完整画像', '年度报告', '审美导师']
  }
]

export function getGrowthStage(favoriteCount: number): GrowthStage {
  return GROWTH_STAGES.find(s => 
    favoriteCount >= s.range[0] && favoriteCount <= s.range[1]
  ) || GROWTH_STAGES[0]
}

export function getUnlockedFeatures(favoriteCount: number): string[] {
  const currentStage = getGrowthStage(favoriteCount)
  const currentIndex = GROWTH_STAGES.indexOf(currentStage)
  
  return GROWTH_STAGES
    .slice(0, currentIndex + 1)
    .flatMap(s => s.features)
}

// ═══════════════════════════════════════════════════════════════
// 7. 核心更新流程
// ═══════════════════════════════════════════════════════════════

export interface UpdateResult {
  profile: UserProfile
  corrected: boolean
  evolved: boolean
  newPersonaId?: string
  stageChanged: boolean
  oldStage?: GrowthStage
  newStage?: GrowthStage
}

/**
 * 更新用户画像（收藏新提示词时调用）
 */
export function updateProfile(
  profile: UserProfile,
  newVector: AestheticVector,
  slug: string
): UpdateResult {
  const oldStage = getGrowthStage(profile.favoriteCount)
  
  // 1. 计算学习率
  const alpha = calculateLearningRate(profile.favoriteCount)
  
  // 2. EMA更新向量
  const oldVector = { ...profile.vector }
  const updatedVector = emaUpdate(profile.vector, newVector, alpha)
  
  // 3. 计算稳定性
  const change = calculateVectorChange(oldVector, updatedVector)
  const stability = calculateStability(change)
  
  // 4. 构建临时画像
  const newFavoriteCount = profile.favoriteCount + 1
  const tempProfile: UserProfile = {
    ...profile,
    vector: updatedVector,
    stability,
    favoriteCount: newFavoriteCount,
    lastUpdated: Date.now(),
    history: [
      ...profile.history,
      { slug, vector: newVector, timestamp: Date.now() }
    ]
  }
  
  // 5. 检查进化（优先于纠正）
  const evolvedPersonaId = checkEvolution(tempProfile)
  const evolved = evolvedPersonaId !== null
  
  // 6. 检查纠正
  const correctedPersonaId = !evolved ? checkCorrection(tempProfile) : null
  const corrected = correctedPersonaId !== null
  
  // 7. 确定最终人格
  const finalPersonaId = evolvedPersonaId || correctedPersonaId || profile.currentPersonaId
  
  // 8. 构建最终画像
  const finalProfile: UserProfile = {
    ...tempProfile,
    currentPersonaId: finalPersonaId
  }
  
  // 9. 检查阶段变化
  const newStage = getGrowthStage(finalProfile.favoriteCount)
  const stageChanged = newStage.name !== oldStage.name
  
  return {
    profile: finalProfile,
    corrected,
    evolved,
    newPersonaId: (evolved || corrected) ? finalPersonaId : undefined,
    stageChanged,
    oldStage: stageChanged ? oldStage : undefined,
    newStage: stageChanged ? newStage : undefined
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. LocalStorage 持久化
// ═══════════════════════════════════════════════════════════════

const PROFILE_STORAGE_KEY = 'cgfan-aesthetic-profile'

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.error('Failed to save aesthetic profile:', error)
  }
}

export function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!stored) return createEmptyProfile()
    
    const parsed = JSON.parse(stored)
    
    if (!parsed.vector || !parsed.currentPersonaId) {
      return createEmptyProfile()
    }
    
    return parsed as UserProfile
  } catch (error) {
    console.error('Failed to load aesthetic profile:', error)
    return createEmptyProfile()
  }
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_STORAGE_KEY)
}
