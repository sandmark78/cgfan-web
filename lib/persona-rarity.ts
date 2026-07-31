/**
 * 美学人格系统 - 稀有度和互补功能
 */

import { PERSONAS, Persona } from './personas'
import { AestheticVector } from './aesthetic-engine'

// 人格稀有度配置（基于用户分布）
export const PERSONA_RARITY: Record<string, { percentage: number; tier: 'common' | 'rare' | 'epic' | 'legendary' }> = {
  // 基础人格
  'minimalist': { percentage: 12.5, tier: 'common' },
  'light-poet': { percentage: 10.2, tier: 'common' },
  'color-riot': { percentage: 8.7, tier: 'common' },
  'nature-gatherer': { percentage: 11.3, tier: 'common' },
  'miniature': { percentage: 7.8, tier: 'rare' },
  'decon': { percentage: 6.5, tier: 'rare' },
  'urban': { percentage: 9.4, tier: 'common' },
  'anime': { percentage: 13.1, tier: 'common' },
  'surreal': { percentage: 5.2, tier: 'rare' },
  'futurist': { percentage: 4.8, tier: 'rare' },
  'eastern': { percentage: 6.9, tier: 'rare' },
  'eclectic': { percentage: 3.6, tier: 'epic' },
  
  // 深度人格（更稀有）
  'zen-master': { percentage: 2.1, tier: 'legendary' },
  'minimal-architect': { percentage: 1.8, tier: 'legendary' },
  'quiet-poet': { percentage: 1.5, tier: 'legendary' },
  'light-chaser': { percentage: 1.9, tier: 'legendary' },
  'atmosphere-creator': { percentage: 1.7, tier: 'legendary' },
  'emotion-catcher': { percentage: 1.6, tier: 'legendary' },
  'neon-painter': { percentage: 1.4, tier: 'legendary' },
  'spectrum-weaver': { percentage: 1.3, tier: 'legendary' },
  'vivid-dreamer': { percentage: 1.2, tier: 'legendary' },
  'landscape-poet': { percentage: 2.0, tier: 'legendary' },
  'seasonal-wanderer': { percentage: 1.8, tier: 'legendary' },
  'wilderness-keeper': { percentage: 1.5, tier: 'legendary' },
  'world-builder': { percentage: 1.1, tier: 'legendary' },
  'tiny-storyteller': { percentage: 1.0, tier: 'legendary' },
  'scale-master': { percentage: 0.9, tier: 'legendary' },
  'space-alchemist': { percentage: 1.3, tier: 'legendary' },
  'structure-breaker': { percentage: 1.2, tier: 'legendary' },
  'void-architect': { percentage: 1.1, tier: 'legendary' },
  'night-walker': { percentage: 1.6, tier: 'legendary' },
  'street-observer': { percentage: 1.5, tier: 'legendary' },
  'city-dreamer': { percentage: 1.4, tier: 'legendary' },
  'character-creator': { percentage: 2.2, tier: 'legendary' },
  'manga-storyteller': { percentage: 2.0, tier: 'legendary' },
  'anime-director': { percentage: 1.8, tier: 'legendary' },
  'dream-weaver': { percentage: 0.8, tier: 'legendary' },
  'reality-bender': { percentage: 0.7, tier: 'legendary' },
  'fantasy-architect': { percentage: 0.9, tier: 'legendary' },
  'tech-visionary': { percentage: 1.0, tier: 'legendary' },
  'cyber-architect': { percentage: 0.9, tier: 'legendary' },
  'space-explorer': { percentage: 0.8, tier: 'legendary' },
  'ink-master': { percentage: 1.4, tier: 'legendary' },
  'tradition-keeper': { percentage: 1.3, tier: 'legendary' },
  'zen-artist': { percentage: 1.2, tier: 'legendary' },
  'style-mixer': { percentage: 0.6, tier: 'legendary' },
  'boundary-breaker': { percentage: 0.5, tier: 'legendary' },
  'trend-hunter': { percentage: 0.7, tier: 'legendary' },
}

// 人格互补关系（基于8维向量的互补性）
export const PERSONA_COMPATIBILITY: Record<string, { personaId: string; compatibility: number; reason: string }[]> = {
  'minimalist': [
    { personaId: 'color-riot', compatibility: 92, reason: '极简与色彩的完美平衡' },
    { personaId: 'anime', compatibility: 85, reason: '留白与叙事的对话' },
    { personaId: 'nature-gatherer', compatibility: 78, reason: '自然与简约的共鸣' },
  ],
  'light-poet': [
    { personaId: 'surreal', compatibility: 88, reason: '光影与梦境的交织' },
    { personaId: 'futurist', compatibility: 82, reason: '光线与科技的碰撞' },
    { personaId: 'eastern', compatibility: 80, reason: '光影与意境的融合' },
  ],
  'color-riot': [
    { personaId: 'minimalist', compatibility: 92, reason: '色彩与留白的对话' },
    { personaId: 'anime', compatibility: 90, reason: '色彩与角色的共鸣' },
    { personaId: 'surreal', compatibility: 85, reason: '色彩与奇幻的碰撞' },
  ],
  'nature-gatherer': [
    { personaId: 'urban', compatibility: 88, reason: '自然与城市的对比' },
    { personaId: 'minimalist', compatibility: 85, reason: '自然与简约的共鸣' },
    { personaId: 'light-poet', compatibility: 82, reason: '自然与光影的融合' },
  ],
  'miniature': [
    { personaId: 'futurist', compatibility: 90, reason: '微缩与未来的想象' },
    { personaId: 'decon', compatibility: 85, reason: '微缩与解构的对话' },
    { personaId: 'surreal', compatibility: 82, reason: '微缩与奇幻的碰撞' },
  ],
  'decon': [
    { personaId: 'futurist', compatibility: 88, reason: '解构与未来的碰撞' },
    { personaId: 'miniature', compatibility: 85, reason: '解构与微缩的对话' },
    { personaId: 'urban', compatibility: 80, reason: '解构与城市的共鸣' },
  ],
  'urban': [
    { personaId: 'nature-gatherer', compatibility: 88, reason: '城市与自然的对比' },
    { personaId: 'decon', compatibility: 85, reason: '城市与解构的对话' },
    { personaId: 'futurist', compatibility: 82, reason: '城市与未来的碰撞' },
  ],
  'anime': [
    { personaId: 'color-riot', compatibility: 90, reason: '动漫与色彩的共鸣' },
    { personaId: 'minimalist', compatibility: 85, reason: '动漫与留白的对话' },
    { personaId: 'surreal', compatibility: 82, reason: '动漫与奇幻的碰撞' },
  ],
  'surreal': [
    { personaId: 'light-poet', compatibility: 88, reason: '奇幻与光影的交织' },
    { personaId: 'futurist', compatibility: 85, reason: '奇幻与未来的碰撞' },
    { personaId: 'anime', compatibility: 82, reason: '奇幻与动漫的对话' },
  ],
  'futurist': [
    { personaId: 'miniature', compatibility: 90, reason: '未来与微缩的想象' },
    { personaId: 'decon', compatibility: 88, reason: '未来与解构的碰撞' },
    { personaId: 'surreal', compatibility: 85, reason: '未来与奇幻的对话' },
  ],
  'eastern': [
    { personaId: 'light-poet', compatibility: 80, reason: '东方与光影的融合' },
    { personaId: 'nature-gatherer', compatibility: 78, reason: '东方与自然的共鸣' },
    { personaId: 'minimalist', compatibility: 75, reason: '东方与简约的对话' },
  ],
  'eclectic': [
    { personaId: 'surreal', compatibility: 85, reason: '杂食与奇幻的碰撞' },
    { personaId: 'futurist', compatibility: 82, reason: '杂食与未来的对话' },
    { personaId: 'color-riot', compatibility: 80, reason: '杂食与色彩的共鸣' },
  ],
}

// 获取人格稀有度信息
export function getPersonaRarity(personaId: string): { percentage: number; tier: string; label: string; color: string } {
  const rarity = PERSONA_RARITY[personaId] || { percentage: 5, tier: 'rare' }
  
  const tierLabels = {
    'common': '常见',
    'rare': '稀有',
    'epic': '史诗',
    'legendary': '传说',
  }
  
  const tierColors = {
    'common': 'text-gray-600',
    'rare': 'text-blue-600',
    'epic': 'text-purple-600',
    'legendary': 'text-amber-600',
  }
  
  return {
    percentage: rarity.percentage,
    tier: rarity.tier,
    label: tierLabels[rarity.tier],
    color: tierColors[rarity.tier],
  }
}

// 获取人格互补信息
export function getPersonaCompatibility(personaId: string): { persona: Persona; compatibility: number; reason: string }[] {
  const compatibilities = PERSONA_COMPATIBILITY[personaId] || []
  
  return compatibilities.map(c => {
    const persona = PERSONAS.find(p => p.id === c.personaId)
    return {
      persona: persona!,
      compatibility: c.compatibility,
      reason: c.reason,
    }
  })
}

// 计算两个人格之间的向量相似度
export function calculatePersonaSimilarity(persona1: Persona, persona2: Persona): number {
  if (!persona1.vector || !persona2.vector) return 0
  
  const v1 = persona1.vector
  const v2 = persona2.vector
  
  // 计算欧氏距离
  const distance = Math.sqrt(
    Math.pow(v1.complexity - v2.complexity, 2) +
    Math.pow(v1.colorIntensity - v2.colorIntensity, 2) +
    Math.pow(v1.arousal - v2.arousal, 2) +
    Math.pow(v1.fluency - v2.fluency, 2) +
    Math.pow(v1.novelty - v2.novelty, 2) +
    Math.pow(v1.harmony - v2.harmony, 2) +
    Math.pow(v1.narrative - v2.narrative, 2) +
    Math.pow(v1.stylization - v2.stylization, 2)
  )
  
  // 转换为相似度（0-100）
  const maxDistance = Math.sqrt(8 * 100 * 100) // 最大可能距离
  const similarity = (1 - distance / maxDistance) * 100
  
  return Math.round(similarity)
}
