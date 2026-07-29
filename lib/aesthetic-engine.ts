/**
 * 美学人格系统 v2.0 - 核心算法
 * 基于8维美学空间的科学匹配系统
 */

// ═══════════════════════════════════════════════════════════════
// 1. 8维美学向量定义
// ═══════════════════════════════════════════════════════════════

export interface AestheticVector {
  complexity: number      // 复杂度：视觉元素丰富程度 (0-100)
  colorIntensity: number  // 色彩强度：饱和度、对比度 (0-100)
  arousal: number         // 情绪唤醒：动态感、戏剧性 (0-100)
  fluency: number         // 处理流畅：对称性、清晰度 (0-100)
  novelty: number         // 新奇性：独特性、创新性 (0-100)
  harmony: number         // 和谐度：协调性、平衡感 (0-100)
  narrative: number       // 叙事性：故事感、情感深度 (0-100)
  stylization: number     // 风格化：与写实风格的偏离度 (0-100)
}

// ═══════════════════════════════════════════════════════════════
// 2. 12个基础人格定义（每人格有8维理想向量）
// ═══════════════════════════════════════════════════════════════

export interface BasePersona {
  id: string
  name: string
  en: string
  tagline: string
  description: string
  vector: AestheticVector
}

export const BASE_PERSONAS: BasePersona[] = [
  {
    id: 'minimalist',
    name: '留白主义者',
    en: 'THE MINIMALIST',
    tagline: '你删掉的，比你画下的更重要。',
    description: '你相信少即是多，每一寸留白都是深思熟虑的选择。你追求形式的纯粹，在简约中发现无限可能。',
    vector: {
      complexity: 20,      // 低复杂度
      colorIntensity: 30,  // 低色彩
      arousal: 25,         // 低唤醒
      fluency: 90,         // 高流畅
      novelty: 40,         // 中新奇
      harmony: 85,         // 高和谐
      narrative: 30,       // 低叙事
      stylization: 50      // 中风格化
    }
  },
  {
    id: 'light-poet',
    name: '光影诗人',
    en: 'THE LIGHT POET',
    tagline: '你相信一束光，能讲完整个故事。',
    description: '你对光线有着天生的敏感，明暗交界处是你最爱的风景。你善于捕捉瞬间的情绪，用光影讲述无声的故事。',
    vector: {
      complexity: 50,
      colorIntensity: 60,
      arousal: 65,         // 高情绪
      fluency: 70,
      novelty: 55,
      harmony: 75,
      narrative: 80,       // 高叙事
      stylization: 45
    }
  },
  {
    id: 'color-riot',
    name: '色彩暴徒',
    en: 'THE COLOR RIOT',
    tagline: '你的眼睛，容不下一点灰。',
    description: '你热爱大胆的色彩碰撞，在你的世界里，没有不敢用的颜色。你用色彩表达态度，用对比创造张力。',
    vector: {
      complexity: 70,
      colorIntensity: 95,  // 极高色彩
      arousal: 85,         // 高唤醒
      fluency: 50,
      novelty: 75,
      harmony: 35,         // 低和谐（撞色）
      narrative: 50,
      stylization: 65
    }
  },
  {
    id: 'nature-gatherer',
    name: '山野拾光人',
    en: 'THE NATURE GATHERER',
    tagline: '你收藏的不是图，是风、雾和光。',
    description: '你对自然有着天然的亲近感，山川湖海是你永恒的灵感来源。你在自然中寻找治愈，在风景中发现诗意。',
    vector: {
      complexity: 45,
      colorIntensity: 55,
      arousal: 40,         // 低唤醒（治愈）
      fluency: 75,
      novelty: 50,
      harmony: 85,         // 高和谐
      narrative: 60,
      stylization: 35
    }
  },
  {
    id: 'miniature',
    name: '微缩造梦师',
    en: 'THE MINIATURE DREAMER',
    tagline: '你把世界装进瓶子，再还给世界。',
    description: '你是微观世界的观察者，相信伟大藏在细节里。你善于在方寸之间构建完整的世界，用精致打动人心。',
    vector: {
      complexity: 85,      // 高复杂度（细节）
      colorIntensity: 60,
      arousal: 50,
      fluency: 65,
      novelty: 80,         // 高新奇
      harmony: 70,
      narrative: 65,
      stylization: 75
    }
  },
  {
    id: 'decon',
    name: '建筑解构者',
    en: 'THE DECONSTRUCTIVIST',
    tagline: '你在秩序里，寻找裂缝的美。',
    description: '你对空间结构有着独特的理解，在规则中寻找突破。你善于发现被忽视的角度，用解构创造新的可能。',
    vector: {
      complexity: 70,
      colorIntensity: 45,
      arousal: 55,
      fluency: 60,
      novelty: 70,
      harmony: 50,         // 中和谐（解构）
      narrative: 55,
      stylization: 70
    }
  },
  {
    id: 'urban',
    name: '都市漫游者',
    en: 'THE URBAN WANDERER',
    tagline: '凌晨三点的城市，是你的画廊。',
    description: '你在城市的缝隙中寻找诗意，霓虹灯下是你的舞台。你善于捕捉都市的节奏，在喧嚣中发现孤独的美。',
    vector: {
      complexity: 65,
      colorIntensity: 70,
      arousal: 70,
      fluency: 55,
      novelty: 65,
      harmony: 50,
      narrative: 75,       // 高叙事
      stylization: 55
    }
  },
  {
    id: 'anime',
    name: '二次元织梦人',
    en: 'THE ANIME WEAVER',
    tagline: '你的想象力，自带滤镜。',
    description: '你活在现实与幻想的交界处，用动漫视角重新诠释世界。你善于创造角色，用二次元表达情感。',
    vector: {
      complexity: 60,
      colorIntensity: 75,
      arousal: 75,
      fluency: 70,
      novelty: 70,
      harmony: 65,
      narrative: 80,
      stylization: 90      // 高风格化
    }
  },
  {
    id: 'surreal',
    name: '超现实造境师',
    en: 'THE SURREALIST',
    tagline: '你的梦，比现实更有条理。',
    description: '你擅长在现实与幻想之间架起桥梁，让不可能变得可信。你善于创造奇异的世界，用超现实表达内心。',
    vector: {
      complexity: 75,
      colorIntensity: 65,
      arousal: 80,
      fluency: 45,         // 低流畅（超现实）
      novelty: 90,         // 高新奇
      harmony: 40,
      narrative: 85,
      stylization: 85
    }
  },
  {
    id: 'futurist',
    name: '未来主义先知',
    en: 'THE FUTURIST',
    tagline: '你提前看到了下一个世纪。',
    description: '你对未来充满想象，科技与艺术的融合让你着迷。你善于构想未来的场景，用视觉预言明天。',
    vector: {
      complexity: 80,
      colorIntensity: 60,
      arousal: 75,
      fluency: 55,
      novelty: 85,
      harmony: 50,
      narrative: 70,
      stylization: 80
    }
  },
  {
    id: 'eastern',
    name: '东方意境师',
    en: 'THE EASTERN MASTER',
    tagline: '你的每一笔，都是千年的呼吸。',
    description: '你对东方美学有着深刻的理解，传统与现代在你手中融合。你善于用留白和意境，表达东方的哲学。',
    vector: {
      complexity: 40,
      colorIntensity: 50,
      arousal: 45,
      fluency: 80,
      novelty: 60,
      harmony: 90,         // 极高和谐
      narrative: 75,
      stylization: 70
    }
  },
  {
    id: 'eclectic',
    name: '杂食审美家',
    en: 'THE ECLECTIC',
    tagline: '你的品味没有边界，只有好奇心。',
    description: '你是开放的美学冒险家，不被任何单一风格定义。你善于发现不同风格的美，用多元视角欣赏世界。',
    vector: {
      complexity: 50,
      colorIntensity: 50,
      arousal: 50,
      fluency: 50,
      novelty: 50,
      harmony: 50,
      narrative: 50,
      stylization: 50
    }
  }
]

// ═══════════════════════════════════════════════════════════════
// 3. 核心算法：余弦相似度
// ═══════════════════════════════════════════════════════════════

/**
 * 计算两个向量的余弦相似度
 * @param a 向量A
 * @param b 向量B
 * @returns 相似度 (0-1)
 */
export function cosineSimilarity(a: AestheticVector, b: AestheticVector): number {
  const keys = Object.keys(a) as (keyof AestheticVector)[]
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (const key of keys) {
    dotProduct += a[key] * b[key]
    normA += a[key] * a[key]
    normB += b[key] * b[key]
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0
  
  return dotProduct / denominator
}

/**
 * 计算欧氏距离
 * @param a 向量A
 * @param b 向量B
 * @returns 距离 (越小越相似)
 */
export function euclideanDistance(a: AestheticVector, b: AestheticVector): number {
  const keys = Object.keys(a) as (keyof AestheticVector)[]
  
  let sum = 0
  for (const key of keys) {
    sum += Math.pow(a[key] - b[key], 2)
  }
  
  return Math.sqrt(sum)
}

// ═══════════════════════════════════════════════════════════════
// 4. 快速测试 → 初始人格匹配
// ═══════════════════════════════════════════════════════════════

export interface QuizOption {
  text: string
  emoji: string
  tags: string[]
  vector: Partial<AestheticVector>  // 每个选项对8维的贡献
}

export interface QuizQuestion {
  id: number
  question: string
  dimension: keyof AestheticVector  // 主要测试的维度
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: '你更偏爱哪种色彩氛围？',
    dimension: 'colorIntensity',
    options: [
      { 
        text: '单色极简', 
        emoji: '⚪', 
        tags: ['黑白', '单色', '留白', '极简'],
        vector: { colorIntensity: 20, complexity: 20, fluency: 90 }
      },
      { 
        text: '自然大地', 
        emoji: '🌿', 
        tags: ['自然', '大地色', '暖色', '东方'],
        vector: { colorIntensity: 50, harmony: 85, narrative: 60 }
      },
      { 
        text: '高饱和撞色', 
        emoji: '🎨', 
        tags: ['高饱和', '撞色', '鲜艳', '波普'],
        vector: { colorIntensity: 95, arousal: 85, harmony: 35 }
      },
      { 
        text: '冷调霓虹', 
        emoji: '💜', 
        tags: ['霓虹', '赛博朋克', '冷色', '科幻'],
        vector: { colorIntensity: 70, novelty: 80, stylization: 80 }
      },
    ],
  },
  {
    id: 2,
    question: '哪种构图最让你心动？',
    dimension: 'fluency',
    options: [
      { 
        text: '对称庄严', 
        emoji: '🏛️', 
        tags: ['对称', '建筑', '结构', '庄严'],
        vector: { fluency: 85, harmony: 80, complexity: 70 }
      },
      { 
        text: '大量留白', 
        emoji: '🗾', 
        tags: ['留白', '呼吸感', '极简', '禅'],
        vector: { fluency: 90, complexity: 20, harmony: 85 }
      },
      { 
        text: '特写微距', 
        emoji: '🔍', 
        tags: ['特写', '微距', '细节', '胶片'],
        vector: { fluency: 65, complexity: 85, novelty: 75 }
      },
      { 
        text: '广角全景', 
        emoji: '🏔️', 
        tags: ['广角', '全景', '壮观', '风景'],
        vector: { fluency: 75, narrative: 70, harmony: 80 }
      },
    ],
  },
  {
    id: 3,
    question: '你希望画面传递什么情绪？',
    dimension: 'arousal',
    options: [
      { 
        text: '安静治愈', 
        emoji: '🕯️', 
        tags: ['安静', '治愈', '温暖', '人间'],
        vector: { arousal: 25, harmony: 85, narrative: 60 }
      },
      { 
        text: '奇幻神秘', 
        emoji: '🌙', 
        tags: ['奇幻', '神秘', '超现实', '梦境'],
        vector: { arousal: 80, novelty: 90, stylization: 85 }
      },
      { 
        text: '故事叙事', 
        emoji: '📖', 
        tags: ['叙事', '电影感', '情绪', '人文'],
        vector: { arousal: 65, narrative: 80, complexity: 65 }
      },
      { 
        text: '未来科幻', 
        emoji: '🚀', 
        tags: ['科幻', '未来', '机械', '太空'],
        vector: { arousal: 75, novelty: 85, stylization: 80 }
      },
    ],
  },
  {
    id: 4,
    question: '你最想收藏什么题材？',
    dimension: 'stylization',
    options: [
      { 
        text: '自然风景', 
        emoji: '🌊', 
        tags: ['自然', '风景', '植物', '山', '海'],
        vector: { stylization: 35, harmony: 85, narrative: 60 }
      },
      { 
        text: '城市建筑', 
        emoji: '🌃', 
        tags: ['城市', '建筑', '夜景', '街头'],
        vector: { stylization: 55, complexity: 70, narrative: 75 }
      },
      { 
        text: '人物角色', 
        emoji: '👤', 
        tags: ['人物', '角色', '肖像', '动漫'],
        vector: { stylization: 90, narrative: 80, arousal: 75 }
      },
      { 
        text: '微缩模型', 
        emoji: '🧊', 
        tags: ['微缩', '模型', '等距', '3D'],
        vector: { stylization: 75, complexity: 85, novelty: 80 }
      },
    ],
  },
]

/**
 * 从测试答案计算用户向量
 * @param answers 每道题选择的选项的vector
 * @returns 用户8维向量
 */
export function calculateVectorFromTest(
  answers: Partial<AestheticVector>[]
): AestheticVector {
  const result: AestheticVector = {
    complexity: 50,
    colorIntensity: 50,
    arousal: 50,
    fluency: 50,
    novelty: 50,
    harmony: 50,
    narrative: 50,
    stylization: 50,
  }
  
  // 对每个维度，取所有答案的平均值
  const keys = Object.keys(result) as (keyof AestheticVector)[]
  
  for (const key of keys) {
    const values = answers
      .map(a => a[key])
      .filter((v): v is number => v !== undefined)
    
    if (values.length > 0) {
      result[key] = values.reduce((sum, v) => sum + v, 0) / values.length
    }
  }
  
  return result
}

/**
 * 匹配最相似的基础人格
 * @param userVector 用户向量
 * @returns 最匹配的人格
 */
export function matchBasePersona(userVector: AestheticVector): BasePersona {
  const similarities = BASE_PERSONAS.map(persona => ({
    persona,
    similarity: cosineSimilarity(userVector, persona.vector)
  }))
  
  // 按相似度降序排序
  similarities.sort((a, b) => b.similarity - a.similarity)
  
  // 如果最高相似度太低（<0.8），返回杂食审美家
  if (similarities[0].similarity < 0.8) {
    return BASE_PERSONAS.find(p => p.id === 'eclectic')!
  }
  
  return similarities[0].persona
}

/**
 * 完整的测试匹配流程
 * @param selectedOptions 每道题选择的选项
 * @returns 匹配的人格
 */
export function processQuizAnswers(
  selectedOptions: QuizOption[]
): BasePersona {
  // 1. 从答案计算用户向量
  const userVector = calculateVectorFromTest(
    selectedOptions.map(opt => opt.vector)
  )
  
  // 2. 匹配最相似的人格
  return matchBasePersona(userVector)
}
