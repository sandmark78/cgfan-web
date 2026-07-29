'use client'

import { AestheticVector } from './aesthetic-engine'

// ═══════════════════════════════════════════════════════════════
// 快速测试题目（每题 6 个选项）
// ═══════════════════════════════════════════════════════════════

export interface QuizOption {
  text: string
  emoji: string
  tags: string[]
  vector: Partial<AestheticVector>
}

export interface QuizQuestion {
  id: number
  question: string
  subtitle: string
  dimension: keyof AestheticVector
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '你更偏爱哪种色彩氛围？',
    subtitle: '选择最让你心动的色调',
    dimension: 'colorIntensity',
    options: [
      {
        text: '单色极简',
        emoji: '⚪',
        tags: ['黑白', '单色', '留白', '极简'],
        vector: { colorIntensity: 20, complexity: 20, fluency: 90, harmony: 80 },
      },
      {
        text: '自然大地',
        emoji: '🌿',
        tags: ['自然', '大地色', '暖色', '东方'],
        vector: { colorIntensity: 50, harmony: 85, narrative: 60, stylization: 35 },
      },
      {
        text: '高饱和撞色',
        emoji: '🎨',
        tags: ['高饱和', '撞色', '鲜艳', '波普'],
        vector: { colorIntensity: 95, arousal: 85, harmony: 35, novelty: 75 },
      },
      {
        text: '冷调霓虹',
        emoji: '💜',
        tags: ['霓虹', '赛博朋克', '冷色', '科幻'],
        vector: { colorIntensity: 75, novelty: 85, stylization: 80, arousal: 70 },
      },
      {
        text: '柔和莫兰迪',
        emoji: '🌫️',
        tags: ['莫兰迪', '低饱和', '高级灰', '温柔'],
        vector: { colorIntensity: 35, harmony: 90, arousal: 25, fluency: 80 },
      },
      {
        text: '复古胶片色',
        emoji: '📷',
        tags: ['胶片', '复古', '怀旧', '颗粒'],
        vector: { colorIntensity: 60, narrative: 75, novelty: 40, harmony: 65 },
      },
    ],
  },
  {
    id: 2,
    question: '哪种构图最让你心动？',
    subtitle: '选择最吸引你的画面结构',
    dimension: 'fluency',
    options: [
      {
        text: '对称庄严',
        emoji: '🏛️',
        tags: ['对称', '建筑', '结构', '庄严'],
        vector: { fluency: 85, harmony: 80, complexity: 70, stylization: 50 },
      },
      {
        text: '大量留白',
        emoji: '⬜',
        tags: ['留白', '呼吸感', '极简', '禅'],
        vector: { fluency: 90, complexity: 20, harmony: 85, stylization: 45 },
      },
      {
        text: '特写微距',
        emoji: '🔍',
        tags: ['特写', '微距', '细节', '胶片'],
        vector: { fluency: 65, complexity: 85, novelty: 75, stylization: 55 },
      },
      {
        text: '广角全景',
        emoji: '🏔️',
        tags: ['广角', '全景', '壮观', '风景'],
        vector: { fluency: 75, narrative: 70, harmony: 80, complexity: 60 },
      },
      {
        text: '黄金螺旋',
        emoji: '🌀',
        tags: ['黄金比例', '螺旋', '和谐', '经典'],
        vector: { fluency: 80, harmony: 90, complexity: 55, narrative: 60 },
      },
      {
        text: '对角张力',
        emoji: '⚡',
        tags: ['对角线', '张力', '动感', '冲突'],
        vector: { fluency: 45, arousal: 80, novelty: 70, harmony: 40 },
      },
    ],
  },
  {
    id: 3,
    question: '你希望画面传递什么情绪？',
    subtitle: '选择最能打动你的氛围',
    dimension: 'arousal',
    options: [
      {
        text: '安静治愈',
        emoji: '🕯️',
        tags: ['安静', '治愈', '温暖', '人间'],
        vector: { arousal: 25, harmony: 85, narrative: 60, fluency: 75 },
      },
      {
        text: '奇幻神秘',
        emoji: '🌙',
        tags: ['奇幻', '神秘', '超现实', '梦境'],
        vector: { arousal: 75, novelty: 90, stylization: 85, narrative: 80 },
      },
      {
        text: '故事叙事',
        emoji: '📖',
        tags: ['叙事', '电影感', '情绪', '人文'],
        vector: { arousal: 60, narrative: 85, complexity: 65, harmony: 60 },
      },
      {
        text: '未来科幻',
        emoji: '🚀',
        tags: ['科幻', '未来', '机械', '太空'],
        vector: { arousal: 70, novelty: 85, stylization: 80, complexity: 75 },
      },
      {
        text: '戏剧张力',
        emoji: '🎭',
        tags: ['戏剧', '张力', '强烈', '冲突'],
        vector: { arousal: 95, novelty: 65, fluency: 40, harmony: 35 },
      },
      {
        text: '温暖怀旧',
        emoji: '🌅',
        tags: ['怀旧', '温暖', '旧时光', '回忆'],
        vector: { arousal: 35, narrative: 80, novelty: 30, harmony: 75 },
      },
    ],
  },
  {
    id: 4,
    question: '你最想收藏什么题材？',
    subtitle: '选择最让你驻足的主题',
    dimension: 'stylization',
    options: [
      {
        text: '自然风景',
        emoji: '🌊',
        tags: ['自然', '风景', '植物', '山', '海'],
        vector: { stylization: 35, harmony: 85, narrative: 60, fluency: 70 },
      },
      {
        text: '城市建筑',
        emoji: '🌃',
        tags: ['城市', '建筑', '夜景', '街头'],
        vector: { stylization: 55, complexity: 70, narrative: 75, fluency: 60 },
      },
      {
        text: '人物角色',
        emoji: '👤',
        tags: ['人物', '角色', '肖像', '动漫'],
        vector: { stylization: 85, narrative: 80, arousal: 70, complexity: 55 },
      },
      {
        text: '微缩模型',
        emoji: '🧊',
        tags: ['微缩', '模型', '等距', '3D'],
        vector: { stylization: 75, complexity: 85, novelty: 80, harmony: 65 },
      },
      {
        text: '抽象艺术',
        emoji: '🎨',
        tags: ['抽象', '艺术', '几何', '实验'],
        vector: { stylization: 95, novelty: 85, fluency: 40, harmony: 50 },
      },
      {
        text: '静物产品',
        emoji: '📦',
        tags: ['静物', '产品', '商业', '精致'],
        vector: { stylization: 40, fluency: 85, harmony: 80, complexity: 50 },
      },
    ],
  },
]
