# 美学人格系统 v2.0 - 完整算法设计

## 一、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户行为层                              │
│  快速测试(4题) → 初始人格 → 收藏行为 → 动态更新 → 进化触发    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    美学维度层 (8D)                            │
│  复杂度 | 色彩强度 | 情绪唤醒 | 流畅性 | 新奇性 | 和谐度 |    │
│  叙事性 | 风格化                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    人格匹配层                                │
│  12基础人格 → 36完整人格 → 余弦相似度 → 最近邻匹配           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    进化系统层                                │
│  收藏数阈值 + 稳定性阈值 + 维度阈值 → 进化触发               │
└─────────────────────────────────────────────────────────────┘
```

## 二、8维美学空间定义

### 2.1 维度定义（基于美学心理学）

| 维度 | 定义 | 心理学依据 | 计算方式 |
|------|------|-----------|---------|
| **复杂度** | 视觉元素的丰富程度 | Berlyne唤醒理论 | Prompt长度 + 元素数量 + 层次深度 |
| **色彩强度** | 饱和度、对比度、色相多样性 | Elliot色彩心理学 | 色彩关键词匹配 |
| **情绪唤醒** | 动态感、戏剧性、张力 | Russell环形情绪模型 | 情绪关键词 + 动态描述 |
| **处理流畅** | 对称性、清晰度、可识别性 | Reber流畅性理论 | 构图关键词 + 极简程度 |
| **新奇性** | 独特性、创新性、非常规 | Berlyne新奇性维度 | 稀有风格 + 创新组合 |
| **和谐度** | 色彩协调、构图平衡、统一 | 格式塔心理学 | 和谐关键词 + 平衡描述 |
| **叙事性** | 故事感、情感深度、意义 | 叙事心理学 | 故事关键词 + 情感描述 |
| **风格化** | 与写实风格的偏离度 | 风格学理论 | 非写实风格关键词 |

### 2.2 维度计算公式

```typescript
interface AestheticVector {
  complexity: number      // 0-100
  colorIntensity: number  // 0-100
  arousal: number         // 0-100
  fluency: number         // 0-100
  novelty: number         // 0-100
  harmony: number         // 0-100
  narrative: number       // 0-100
  stylization: number     // 0-100
}

// 从 Prompt DNA 计算维度
function calculateVector(dna: PromptDNA): AestheticVector {
  return {
    // 复杂度 = Prompt长度归一化 + 元素数量加权
    complexity: Math.min(100, 
      (dna.prompt.length / 50) + 
      (dna.dna.material?.length || 0) * 10 +
      (dna.dna.styles?.length || 0) * 5
    ),
    
    // 色彩强度 = 色彩关键词匹配度
    colorIntensity: calculateColorIntensity(dna),
    
    // 情绪唤醒 = 情绪关键词 + 动态描述
    arousal: calculateArousal(dna),
    
    // 处理流畅 = 对称性 + 极简 + 清晰度
    fluency: calculateFluency(dna),
    
    // 新奇性 = 稀有风格 + 创新组合
    novelty: calculateNovelty(dna),
    
    // 和谐度 = 协调关键词 + 平衡描述
    harmony: calculateHarmony(dna),
    
    // 叙事性 = 故事关键词 + 情感描述
    narrative: calculateNarrative(dna),
    
    // 风格化 = 非写实风格程度
    stylization: calculateStylization(dna),
  }
}
```

## 三、12个初始人格

### 3.1 人格定义

基于8维空间，定义12个核心人格的理想向量：

```typescript
const BASE_PERSONAS = [
  {
    id: 'minimalist',
    name: '留白主义者',
    en: 'THE MINIMALIST',
    tagline: '你删掉的，比你画下的更重要。',
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
```

## 四、36个完整人格（进化路径）

### 4.1 进化规则

每个基础人格可进化为3个深度人格（12 × 3 = 36）

**进化条件：**
1. 收藏数 ≥ 20
2. 稳定性 ≥ 0.7（维度变化幅度小）
3. 特定维度达到阈值

```typescript
interface EvolutionRule {
  from: string
  to: string[]
  conditions: {
    minFavorites: number
    minStability: number
    dimensionThresholds: {
      [key: string]: { min?: number; max?: number }
    }
  }
}

const EVOLUTION_RULES: EvolutionRule[] = [
  {
    from: 'minimalist',
    to: ['zen-master', 'minimal-architect', 'quiet-poet'],
    conditions: {
      minFavorites: 20,
      minStability: 0.7,
      dimensionThresholds: {
        fluency: { min: 80 },
        harmony: { min: 75 },
        complexity: { max: 30 }
      }
    }
  },
  {
    from: 'light-poet',
    to: ['light-chaser', 'atmosphere-creator', 'emotion-catcher'],
    conditions: {
      minFavorites: 20,
      minStability: 0.65,
      dimensionThresholds: {
        arousal: { min: 60 },
        narrative: { min: 70 }
      }
    }
  },
  // ... 其他10个基础人格的进化规则
]
```

### 4.2 深度人格示例

```typescript
const DEEP_PERSONAS = [
  // 留白主义者 → 3个深度人格
  {
    id: 'zen-master',
    name: '空寂大师',
    en: 'THE ZEN MASTER',
    tagline: '你在虚无中，看见万物的本质。',
    evolvesFrom: 'minimalist',
    vector: {
      complexity: 10,      // 极低
      colorIntensity: 20,
      arousal: 15,
      fluency: 95,         // 极高
      novelty: 50,
      harmony: 95,         // 极高
      narrative: 40,
      stylization: 60
    }
  },
  {
    id: 'minimal-architect',
    name: '极简建筑师',
    en: 'THE MINIMAL ARCHITECT',
    tagline: '你用最少的元素，构建最大的空间。',
    evolvesFrom: 'minimalist',
    vector: {
      complexity: 30,
      colorIntensity: 35,
      arousal: 30,
      fluency: 85,
      novelty: 55,
      harmony: 80,
      narrative: 45,
      stylization: 65
    }
  },
  {
    id: 'quiet-poet',
    name: '静谧诗人',
    en: 'THE QUIET POET',
    tagline: '你的诗，写在留白里。',
    evolvesFrom: 'minimalist',
    vector: {
      complexity: 25,
      colorIntensity: 30,
      arousal: 20,
      fluency: 90,
      novelty: 45,
      harmony: 85,
      narrative: 70,       // 高叙事
      stylization: 55
    }
  },
  
  // 光影诗人 → 3个深度人格
  {
    id: 'light-chaser',
    name: '追光者',
    en: 'THE LIGHT CHASER',
    tagline: '你不只是看光，你在追逐光的方向。',
    evolvesFrom: 'light-poet',
    vector: {
      complexity: 55,
      colorIntensity: 70,
      arousal: 75,
      fluency: 65,
      novelty: 60,
      harmony: 70,
      narrative: 85,
      stylization: 50
    }
  },
  // ... 其他33个深度人格
]
```

## 五、核心算法

### 5.1 初始匹配算法

```typescript
function initialMatch(testAnswers: string[]): Persona {
  // 1. 从4道题的答案计算8维向量
  const userVector = calculateVectorFromTest(testAnswers)
  
  // 2. 计算与12个基础人格的余弦相似度
  const similarities = BASE_PERSONAS.map(persona => ({
    persona,
    similarity: cosineSimilarity(userVector, persona.vector)
  }))
  
  // 3. 返回最相似的人格
  similarities.sort((a, b) => b.similarity - a.similarity)
  return similarities[0].persona
}

function cosineSimilarity(a: AestheticVector, b: AestheticVector): number {
  const keys = Object.keys(a) as (keyof AestheticVector)[]
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (const key of keys) {
    dotProduct += a[key] * b[key]
    normA += a[key] * a[key]
    normB += b[key] * b[key]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
```

### 5.2 动态更新算法（EMA）

```typescript
function updateUserProfile(
  currentProfile: UserProfile,
  newFavorite: AestheticVector,
  favoriteCount: number
): UserProfile {
  // 学习率：收藏越多，更新越慢（越稳定）
  const alpha = Math.max(0.1, 1 / Math.sqrt(favoriteCount))
  
  // 指数移动平均更新
  const updatedVector: AestheticVector = {
    complexity: currentProfile.vector.complexity * (1 - alpha) + newFavorite.complexity * alpha,
    colorIntensity: currentProfile.vector.colorIntensity * (1 - alpha) + newFavorite.colorIntensity * alpha,
    arousal: currentProfile.vector.arousal * (1 - alpha) + newFavorite.arousal * alpha,
    fluency: currentProfile.vector.fluency * (1 - alpha) + newFavorite.fluency * alpha,
    novelty: currentProfile.vector.novelty * (1 - alpha) + newFavorite.novelty * alpha,
    harmony: currentProfile.vector.harmony * (1 - alpha) + newFavorite.harmony * alpha,
    narrative: currentProfile.vector.narrative * (1 - alpha) + newFavorite.narrative * alpha,
    stylization: currentProfile.vector.stylization * (1 - alpha) + newFavorite.stylization * alpha,
  }
  
  // 计算稳定性（维度变化幅度的倒数）
  const changes = keys.map(k => 
    Math.abs(updatedVector[k] - currentProfile.vector[k])
  )
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
  const stability = Math.max(0, 1 - avgChange / 100)
  
  return {
    vector: updatedVector,
    stability,
    favoriteCount
  }
}
```

### 5.3 进化触发算法

```typescript
function checkEvolution(profile: UserProfile): string | null {
  const { vector, stability, favoriteCount } = profile
  
  // 1. 检查收藏数
  if (favoriteCount < 20) return null
  
  // 2. 找到当前基础人格
  const currentBase = findCurrentBasePersona(vector)
  
  // 3. 检查进化规则
  const rule = EVOLUTION_RULES.find(r => r.from === currentBase.id)
  if (!rule) return null
  
  // 4. 检查稳定性
  if (stability < rule.conditions.minStability) return null
  
  // 5. 检查维度阈值
  for (const [dim, threshold] of Object.entries(rule.conditions.dimensionThresholds)) {
    const value = vector[dim as keyof AestheticVector]
    if (threshold.min && value < threshold.min) return null
    if (threshold.max && value > threshold.max) return null
  }
  
  // 6. 从3个深度人格中选择最匹配的
  const deepPersonas = DEEP_PERSONAS.filter(p => 
    rule.to.includes(p.id)
  )
  
  const bestMatch = deepPersonas.reduce((best, p) => {
    const sim = cosineSimilarity(vector, p.vector)
    return sim > best.similarity ? { persona: p, similarity: sim } : best
  }, { persona: null, similarity: -1 })
  
  return bestMatch.persona?.id || null
}
```

### 5.4 纠正机制

```typescript
function checkCorrection(profile: UserProfile, currentPersona: string): string | null {
  // 如果用户收藏与当前人格差异过大，触发纠正
  
  const currentVector = PERSONAS.find(p => p.id === currentPersona)?.vector
  if (!currentVector) return null
  
  const similarity = cosineSimilarity(profile.vector, currentVector)
  
  // 如果相似度低于0.6，说明当前人格不再匹配
  if (similarity < 0.6) {
    // 重新匹配最相似的人格
    const bestMatch = findBestMatch(profile.vector)
    return bestMatch.id
  }
  
  return null
}
```

## 六、数据结构

```typescript
interface UserProfile {
  vector: AestheticVector
  stability: number
  favoriteCount: number
  currentPersona: string
  evolvedPersona?: string
  history: Array<{
    timestamp: number
    action: 'favorite' | 'unfavorite'
    vector: AestheticVector
  }>
}

interface GrowthStage {
  name: string
  icon: string
  range: [number, number]
  features: string[]
}

const GROWTH_STAGES: GrowthStage[] = [
  { name: '探索期', icon: '🌱', range: [0, 4], features: ['初始人格'] },
  { name: '形成期', icon: '🌿', range: [5, 19], features: ['品味光谱', '分类偏好'] },
  { name: '沉浸期', icon: '🌳', range: [20, 49], features: ['深度人格', '进化提示'] },
  { name: '策展期', icon: '🏆', range: [50, 99], features: ['策展人认证', '审美报告'] },
  { name: '大师期', icon: '👑', range: [100, Infinity], features: ['完整画像', '年度报告'] }
]
```

## 七、实施计划

### Phase 1: 基础框架（本周）
- [ ] 实现8维向量计算
- [ ] 定义12个基础人格向量
- [ ] 实现余弦相似度匹配
- [ ] 实现快速测试→初始人格

### Phase 2: 动态系统（下周）
- [ ] 实现EMA动态更新
- [ ] 实现稳定性计算
- [ ] 实现纠正机制
- [ ] 前端可视化（8维雷达图）

### Phase 3: 进化系统（第3周）
- [ ] 定义36个完整人格向量
- [ ] 实现进化规则
- [ ] 实现进化触发
- [ ] 前端进化动画

## 八、验证指标

1. **匹配准确性**: 人格匹配与用户自我认知一致性 > 75%
2. **稳定性**: 收藏20+后，人格变化率 < 10%
3. **进化合理性**: 进化后用户满意度 > 70%
4. **纠正有效性**: 纠正后匹配度提升 > 20%

---

**下一步**: 先实施 Phase 1，定义12个基础人格的向量坐标，实现初始匹配算法。
