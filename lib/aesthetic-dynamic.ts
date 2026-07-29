/**
 * 美学人格系统 v2.0 - Phase 2: 动态系统
 * EMA动态更新、稳定性计算、纠正机制、成长阶段
 */

import { 
  AestheticVector, 
  BasePersona, 
  BASE_PERSONAS, 
  cosineSimilarity 
} from './aesthetic-engine'

// ═══════════════════════════════════════════════════════════════
// 1. 用户画像数据结构
// ═══════════════════════════════════════════════════════════════

export interface UserProfile {
  /** 用户当前8维向量 */
  vector: AestheticVector
  /** 稳定性指标 (0-1)，越高越稳定 */
  stability: number
  /** 当前匹配的基础人格ID */
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
 * 
 * @param favoriteCount 当前收藏数量
 * @returns 学习率 (0.1 - 1.0)
 */
export function calculateLearningRate(favoriteCount: number): number {
  // 使用平方根衰减，确保：
  // - 1个收藏时 alpha ≈ 1.0（完全信任新数据）
  // - 10个收藏时 alpha ≈ 0.32
  // - 50个收藏时 alpha ≈ 0.14
  // - 100个收藏时 alpha ≈ 0.1（最低）
  return Math.max(0.1, 1 / Math.sqrt(favoriteCount + 1))
}

/**
 * 指数移动平均（EMA）更新用户向量
 * 
 * 公式: new_vector = old_vector * (1 - alpha) + new_data * alpha
 * 
 * @param oldVector 旧向量
 * @param newData 新数据向量
 * @param alpha 学习率
 * @returns 更新后的向量
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
 * 
 * @param oldVector 旧向量
 * @param newVector 新向量
 * @returns 平均变化幅度 (0-100)
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
 * 
 * 稳定性 = 1 - (平均变化幅度 / 100)
 * 
 * @param change 平均变化幅度
 * @returns 稳定性 (0-1)
 */
export function calculateStability(change: number): number {
  return Math.max(0, Math.min(1, 1 - change / 100))
}

// ═══════════════════════════════════════════════════════════════
// 4. 纠正机制
// ═══════════════════════════════════════════════════════════════

/**
 * 检查是否需要纠正人格匹配
 * 
 * 当用户向量与当前人格的相似度 < 0.6 时，触发纠正
 * 
 * @param profile 用户画像
 * @returns 需要纠正时返回新的人格ID，否则返回null
 */
export function checkCorrection(profile: UserProfile): string | null {
  const currentPersona = BASE_PERSONAS.find(p => p.id === profile.currentPersonaId)
  if (!currentPersona) return null
  
  const similarity = cosineSimilarity(profile.vector, currentPersona.vector)
  
  // 相似度低于0.6，说明当前人格不再匹配
  if (similarity < 0.6) {
    // 重新匹配最相似的人格
    const similarities = BASE_PERSONAS.map(persona => ({
      id: persona.id,
      similarity: cosineSimilarity(profile.vector, persona.vector)
    }))
    
    similarities.sort((a, b) => b.similarity - a.similarity)
    
    // 如果新匹配的人格相似度更高，返回新ID
    if (similarities[0].id !== profile.currentPersonaId) {
      return similarities[0].id
    }
  }
  
  return null
}

// ═══════════════════════════════════════════════════════════════
// 5. 成长阶段系统
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

/**
 * 获取当前成长阶段
 * 
 * @param favoriteCount 收藏数量
 * @returns 当前成长阶段
 */
export function getGrowthStage(favoriteCount: number): GrowthStage {
  return GROWTH_STAGES.find(s => 
    favoriteCount >= s.range[0] && favoriteCount <= s.range[1]
  ) || GROWTH_STAGES[0]
}

/**
 * 获取已解锁的功能列表
 * 
 * @param favoriteCount 收藏数量
 * @returns 已解锁的功能列表
 */
export function getUnlockedFeatures(favoriteCount: number): string[] {
  const currentStage = getGrowthStage(favoriteCount)
  const currentIndex = GROWTH_STAGES.indexOf(currentStage)
  
  return GROWTH_STAGES
    .slice(0, currentIndex + 1)
    .flatMap(s => s.features)
}

// ═══════════════════════════════════════════════════════════════
// 6. 核心更新流程
// ═══════════════════════════════════════════════════════════════

export interface UpdateResult {
  profile: UserProfile
  corrected: boolean
  newPersonaId?: string
  stageChanged: boolean
  oldStage?: GrowthStage
  newStage?: GrowthStage
}

/**
 * 更新用户画像（收藏新提示词时调用）
 * 
 * @param profile 当前用户画像
 * @param newVector 新收藏的提示词向量
 * @param slug 提示词slug
 * @returns 更新结果
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
  
  // 4. 检查纠正
  const tempProfile: UserProfile = {
    ...profile,
    vector: updatedVector,
    stability,
    favoriteCount: profile.favoriteCount + 1,
    lastUpdated: Date.now(),
    history: [
      ...profile.history,
      { slug, vector: newVector, timestamp: Date.now() }
    ]
  }
  
  const correctedPersonaId = checkCorrection(tempProfile)
  const corrected = correctedPersonaId !== null
  const finalPersonaId = correctedPersonaId || profile.currentPersonaId
  
  // 5. 构建最终画像
  const finalProfile: UserProfile = {
    ...tempProfile,
    currentPersonaId: finalPersonaId
  }
  
  // 6. 检查阶段变化
  const newStage = getGrowthStage(finalProfile.favoriteCount)
  const stageChanged = newStage.name !== oldStage.name
  
  return {
    profile: finalProfile,
    corrected,
    newPersonaId: corrected ? correctedPersonaId : undefined,
    stageChanged,
    oldStage: stageChanged ? oldStage : undefined,
    newStage: stageChanged ? newStage : undefined
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. LocalStorage 持久化
// ═══════════════════════════════════════════════════════════════

const PROFILE_STORAGE_KEY = 'cgfan-aesthetic-profile'

/**
 * 保存用户画像到 localStorage
 */
export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch (error) {
    console.error('Failed to save aesthetic profile:', error)
  }
}

/**
 * 从 localStorage 读取用户画像
 */
export function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!stored) return createEmptyProfile()
    
    const parsed = JSON.parse(stored)
    
    // 验证数据结构
    if (!parsed.vector || !parsed.currentPersonaId) {
      return createEmptyProfile()
    }
    
    return parsed as UserProfile
  } catch (error) {
    console.error('Failed to load aesthetic profile:', error)
    return createEmptyProfile()
  }
}

/**
 * 清除用户画像（用于测试或重置）
 */
export function clearProfile(): void {
  localStorage.removeItem(PROFILE_STORAGE_KEY)
}
