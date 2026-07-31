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
  {
    id: 5,
    question: '你更偏好哪种画面丰富度？',
    subtitle: '选择你觉得舒适的视觉信息量',
    dimension: 'complexity',
    options: [
      {
        text: '极简纯粹',
        emoji: '⚪',
        tags: ['极简', '纯粹', '单一', '干净'],
        vector: { complexity: 15, fluency: 90, harmony: 85, stylization: 40 },
      },
      {
        text: '精致克制',
        emoji: '🎯',
        tags: ['精致', '克制', '细节', '品质'],
        vector: { complexity: 45, fluency: 80, harmony: 75, stylization: 65 },
      },
      {
        text: '丰富饱满',
        emoji: '🎨',
        tags: ['丰富', '饱满', '细节', '层次'],
        vector: { complexity: 70, fluency: 65, harmony: 70, stylization: 75 },
      },
      {
        text: '繁复华丽',
        emoji: '👑',
        tags: ['繁复', '华丽', '装饰', '奢华'],
        vector: { complexity: 90, fluency: 50, harmony: 60, stylization: 85 },
      },
      {
        text: '信息密集',
        emoji: '📊',
        tags: ['信息', '密集', '数据', '图表'],
        vector: { complexity: 85, fluency: 55, harmony: 65, narrative: 70 },
      },
      {
        text: '有机混沌',
        emoji: '🌿',
        tags: ['有机', '混沌', '自然', '随机'],
        vector: { complexity: 75, fluency: 60, novelty: 80, harmony: 55 },
      },
    ],
  },
  {
    id: 6,
    question: '你更看重画面的哪种和谐感？',
    subtitle: '选择最让你感到舒适的视觉关系',
    dimension: 'harmony',
    options: [
      {
        text: '色彩协调',
        emoji: '🎨',
        tags: ['色彩', '协调', '配色', '统一'],
        vector: { harmony: 90, colorIntensity: 70, fluency: 80, arousal: 55 },
      },
      {
        text: '构图平衡',
        emoji: '⚖️',
        tags: ['构图', '平衡', '对称', '稳定'],
        vector: { harmony: 85, fluency: 85, complexity: 60, arousal: 45 },
      },
      {
        text: '情绪统一',
        emoji: '🌙',
        tags: ['情绪', '统一', '氛围', '沉浸'],
        vector: { harmony: 80, narrative: 75, arousal: 70, stylization: 65 },
      },
      {
        text: '风格一致',
        emoji: '🎯',
        tags: ['风格', '一致', '纯粹', '专注'],
        vector: { harmony: 85, stylization: 80, fluency: 75, novelty: 50 },
      },
      {
        text: '对比张力',
        emoji: '⚡',
        tags: ['对比', '张力', '冲突', '戏剧'],
        vector: { harmony: 35, arousal: 85, novelty: 75, complexity: 70 },
      },
      {
        text: '自然过渡',
        emoji: '🌊',
        tags: ['自然', '过渡', '柔和', '流畅'],
        vector: { harmony: 90, fluency: 85, arousal: 40, narrative: 60 },
      },
    ],
  },
  {
    id: 7,
    question: '你更喜欢哪种光的质感？',
    subtitle: '选择最让你心动的光线',
    dimension: 'narrative',
    options: [
      {
        text: '自然柔光',
        emoji: '☀️',
        tags: ['自然', '柔光', '清晨', '温暖'],
        vector: { narrative: 60, harmony: 80, fluency: 75, colorIntensity: 55 },
      },
      {
        text: '戏剧逆光',
        emoji: '🌅',
        tags: ['逆光', '戏剧', '剪影', '氛围'],
        vector: { narrative: 85, arousal: 80, stylization: 70, colorIntensity: 65 },
      },
      {
        text: '霓虹夜光',
        emoji: '🌃',
        tags: ['霓虹', '夜景', '赛博朋克', '冷色'],
        vector: { narrative: 70, novelty: 85, stylization: 80, colorIntensity: 75 },
      },
      {
        text: '烛光暖黄',
        emoji: '🕯️',
        tags: ['烛光', '暖黄', '温馨', '复古'],
        vector: { narrative: 80, arousal: 60, harmony: 75, colorIntensity: 70 },
      },
      {
        text: '影棚布光',
        emoji: '💡',
        tags: ['影棚', '布光', '专业', '时尚'],
        vector: { narrative: 55, fluency: 85, harmony: 80, colorIntensity: 60 },
      },
      {
        text: '月光冷调',
        emoji: '🌙',
        tags: ['月光', '冷调', '清冷', '神秘'],
        vector: { narrative: 75, arousal: 65, stylization: 65, colorIntensity: 45 },
      },
    ],
  },
  {
    id: 8,
    question: '你更被哪种新奇感吸引？',
    subtitle: '选择最让你眼前一亮的创意',
    dimension: 'novelty',
    options: [
      {
        text: '超现实组合',
        emoji: '🌌',
        tags: ['超现实', '组合', '奇幻', '梦境'],
        vector: { novelty: 90, stylization: 85, narrative: 75, arousal: 75 },
      },
      {
        text: '技术创新',
        emoji: '🔬',
        tags: ['技术', '创新', '实验', '前沿'],
        vector: { novelty: 85, complexity: 80, stylization: 75, arousal: 65 },
      },
      {
        text: '文化融合',
        emoji: '🌍',
        tags: ['文化', '融合', '多元', '跨界'],
        vector: { novelty: 80, narrative: 75, stylization: 70, harmony: 60 },
      },
      {
        text: '经典重构',
        emoji: '🔄',
        tags: ['经典', '重构', '创新', '传承'],
        vector: { novelty: 75, narrative: 70, stylization: 75, harmony: 65 },
      },
      {
        text: '熟悉舒适',
        emoji: '🏠',
        tags: ['熟悉', '舒适', '传统', '稳定'],
        vector: { novelty: 25, harmony: 85, fluency: 85, arousal: 40 },
      },
      {
        text: '意外惊喜',
        emoji: '🎁',
        tags: ['意外', '惊喜', '幽默', '趣味'],
        vector: { novelty: 85, arousal: 80, narrative: 70, harmony: 55 },
      },
    ],
  },
]
