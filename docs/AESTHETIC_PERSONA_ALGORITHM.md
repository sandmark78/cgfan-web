# 美学人格系统算法设计

## 一、理论基础

### 1.1 美学心理学依据

#### Berlyne 的唤醒理论 (1974)
- **复杂性 (Complexity)**: 视觉元素的丰富程度
- **新奇性 (Novelty)**: 与常见模式的差异度
- **不确定性 (Uncertainty)**: 意义的模糊程度
- **冲突性 (Conflict)**: 相互矛盾的视觉线索

**应用**: 用户的审美偏好与其对"唤醒水平"的偏好相关

#### 处理流畅性理论 (Reber et al., 2004)
- 人脑偏好容易处理的信息
- 对称性、对比度、清晰度影响处理流畅性
- 中等复杂度最易产生美感（倒U曲线）

#### 色彩心理学 (Elliot & Maier, 2014)
- **暖色调**: 激发、活跃、亲近
- **冷色调**: 平静、疏离、专业
- **饱和度**: 高饱和=强烈情绪，低饱和=克制内敛
- **明度**: 高明度=轻盈，低明度=沉稳

#### 大五人格与审美 (Rentfrow & Gosling, 2003)
- **开放性 (Openness)**: 与审美多样性正相关
- **尽责性 (Conscientiousness)**: 偏好秩序、对称
- **外向性 (Extraversion)**: 偏好明亮、社交性内容
- **宜人性 (Agreeableness)**: 偏好温暖、和谐
- **神经质 (Neuroticism)**: 偏好情绪化、戏剧性内容

### 1.2 美学维度模型

基于上述理论，我们定义 **8 个核心美学维度**:

```typescript
interface AestheticDimensions {
  // 视觉复杂度 (0-100)
  // 基于: 元素数量、细节密度、层次深度
  complexity: number
  
  // 色彩强度 (0-100)
  // 基于: 饱和度、对比度、色相多样性
  colorIntensity: number
  
  // 情绪唤醒度 (0-100)
  // 基于: 动态感、戏剧性、张力
  arousal: number
  
  // 处理流畅性 (0-100)
  // 基于: 对称性、清晰度、可识别性
  fluency: number
  
  // 新奇性 (0-100)
  // 基于: 独特性、创新性、非常规组合
  novelty: number
  
  // 和谐度 (0-100)
  // 基于: 色彩协调、构图平衡、元素统一
  harmony: number
  
  // 叙事性 (0-100)
  // 基于: 故事感、情感深度、意义丰富度
  narrative: number
  
  // 风格化程度 (0-100)
  // 基于: 与写实风格的偏离度
  stylization: number
}
```

## 二、图片多维评分算法

### 2.1 基于 Prompt DNA 的维度计算

```typescript
function calculateDimensions(dna: PromptDNA): AestheticDimensions {
  const dims: AestheticDimensions = {
    complexity: 0,
    colorIntensity: 0,
    arousal: 0,
    fluency: 0,
    novelty: 0,
    harmony: 0,
    narrative: 0,
    stylization: 0
  }
  
  // 1. 复杂度 - 基于 Prompt 长度和元素数量
  const promptLength = dna.prompt.length
  const elementCount = dna.dna.material?.length || 0
  dims.complexity = Math.min(100, 
    (promptLength / 50) + (elementCount * 10)
  )
  
  // 2. 色彩强度 - 基于色彩关键词
  const colorKeywords = ['高饱和', '撞色', '鲜艳', '霓虹', '黑白', '单色']
  const colorMatches = dna.dna.styles?.filter(s => 
    colorKeywords.some(k => s[0].includes(k))
  ) || []
  dims.colorIntensity = Math.min(100, colorMatches.length * 25)
  
  // 3. 情绪唤醒度 - 基于情绪关键词
  const arousalKeywords = ['戏剧', '张力', '动态', '强烈', '安静', '治愈']
  const arousalMatches = dna.dna.styles?.filter(s => 
    arousalKeywords.some(k => s[0].includes(k))
  ) || []
  dims.arousal = Math.min(100, arousalMatches.length * 20)
  
  // 4. 处理流畅性 - 基于构图和对称性
  const fluencyKeywords = ['对称', '极简', '留白', '清晰']
  const fluencyMatches = dna.dna.composition?.filter(c => 
    fluencyKeywords.some(k => c[0].includes(k))
  ) || []
  dims.fluency = Math.min(100, fluencyMatches.length * 30)
  
  // 5. 新奇性 - 基于风格独特性
  const rareStyles = ['超现实', '赛博朋克', '蒸汽波', '暗黑']
  const rareMatches = dna.dna.styles?.filter(s => 
    rareStyles.some(k => s[0].includes(k))
  ) || []
  dims.novelty = Math.min(100, rareMatches.length * 30)
  
  // 6. 和谐度 - 基于色彩和构图协调
  const harmonyKeywords = ['和谐', '平衡', '统一', '协调']
  const harmonyMatches = dna.dna.styles?.filter(s => 
    harmonyKeywords.some(k => s[0].includes(k))
  ) || []
  dims.harmony = Math.min(100, harmonyMatches.length * 25)
  
  // 7. 叙事性 - 基于故事感关键词
  const narrativeKeywords = ['故事', '叙事', '情感', '电影感']
  const narrativeMatches = dna.dna.styles?.filter(s => 
    narrativeKeywords.some(k => s[0].includes(k))
  ) || []
  dims.narrative = Math.min(100, narrativeMatches.length * 25)
  
  // 8. 风格化程度 - 基于与写实的偏离
  const stylizedKeywords = ['抽象', '插画', '动漫', '3D渲染']
  const stylizedMatches = dna.dna.styles?.filter(s => 
    stylizedKeywords.some(k => s[0].includes(k))
  ) || []
  dims.stylization = Math.min(100, stylizedMatches.length * 25)
  
  return dims
}
```

### 2.2 用户审美画像

```typescript
interface UserAestheticProfile {
  // 8维平均偏好
  dimensions: AestheticDimensions
  
  // 维度权重（反映用户对不同维度的重视程度）
  weights: AestheticDimensions
  
  // 偏好稳定性（0-1，越高越稳定）
  stability: number
  
  // 审美多样性（0-1，越高越多元）
  diversity: number
}

function updateUserProfile(
  current: UserAestheticProfile,
  newFavorite: AestheticDimensions,
  favoriteCount: number
): UserAestheticProfile {
  // 指数移动平均（EMA）更新
  const alpha = Math.max(0.1, 1 / favoriteCount)
  
  const updated: AestheticDimensions = {
    complexity: current.dimensions.complexity * (1 - alpha) + newFavorite.complexity * alpha,
    colorIntensity: current.dimensions.colorIntensity * (1 - alpha) + newFavorite.colorIntensity * alpha,
    arousal: current.dimensions.arousal * (1 - alpha) + newFavorite.arousal * alpha,
    fluency: current.dimensions.fluency * (1 - alpha) + newFavorite.fluency * alpha,
    novelty: current.dimensions.novelty * (1 - alpha) + newFavorite.novelty * alpha,
    harmony: current.dimensions.harmony * (1 - alpha) + newFavorite.harmony * alpha,
    narrative: current.dimensions.narrative * (1 - alpha) + newFavorite.narrative * alpha,
    stylization: current.dimensions.stylization * (1 - alpha) + newFavorite.stylization * alpha,
  }
  
  // 计算稳定性（基于维度变化幅度）
  const changes = Object.keys(updated).map(k => 
    Math.abs(updated[k as keyof AestheticDimensions] - current.dimensions[k as keyof AestheticDimensions])
  )
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
  const stability = Math.max(0, 1 - avgChange / 100)
  
  // 计算多样性（基于维度方差）
  const values = Object.values(updated)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const diversity = Math.min(1, Math.sqrt(variance) / 50)
  
  return {
    dimensions: updated,
    weights: current.weights, // 权重暂不动态调整
    stability,
    diversity
  }
}
```

## 三、人格匹配算法

### 3.1 人格向量定义

每个人格在 8 维空间中有理想坐标：

```typescript
interface PersonaVector {
  id: string
  name: string
  vector: AestheticDimensions
  description: string
}

const PERSONA_VECTORS: PersonaVector[] = [
  {
    id: 'minimalist',
    name: '留白主义者',
    vector: {
      complexity: 20,      // 低复杂度
      colorIntensity: 30,  // 低色彩强度
      arousal: 25,         // 低唤醒
      fluency: 90,         // 高流畅性
      novelty: 40,         // 中等新奇
      harmony: 85,         // 高和谐
      narrative: 30,       // 低叙事
      stylization: 50      // 中等风格化
    },
    description: '你删掉的，比你画下的更重要。'
  },
  {
    id: 'color-riot',
    name: '色彩暴徒',
    vector: {
      complexity: 70,
      colorIntensity: 95,  // 极高色彩强度
      arousal: 80,
      fluency: 50,
      novelty: 75,
      harmony: 40,         // 低和谐（撞色）
      narrative: 50,
      stylization: 60
    },
    description: '你的眼睛，容不下一点灰。'
  },
  // ... 其他 34 种人格
]
```

### 3.2 相似度计算

使用**加权余弦相似度**：

```typescript
function cosineSimilarity(a: AestheticDimensions, b: AestheticDimensions): number {
  const keys = Object.keys(a) as (keyof AestheticDimensions)[]
  
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

function matchPersona(
  userProfile: UserAestheticProfile,
  personaVectors: PersonaVector[]
): { persona: PersonaVector; similarity: number }[] {
  return personaVectors
    .map(pv => ({
      persona: pv,
      similarity: cosineSimilarity(userProfile.dimensions, pv.vector)
    }))
    .sort((a, b) => b.similarity - a.similarity)
}
```

### 3.3 人格进化机制

```typescript
interface EvolutionRule {
  from: string           // 基础人格 ID
  to: string            // 深度人格 ID
  conditions: {
    minFavorites: number
    minStability: number
    dimensionThresholds: Partial<AestheticDimensions>
  }
}

const EVOLUTION_RULES: EvolutionRule[] = [
  {
    from: 'minimalist',
    to: 'zen-master',
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
    from: 'color-riot',
    to: 'color-alchemist',
    conditions: {
      minFavorites: 20,
      minStability: 0.6,
      dimensionThresholds: {
        colorIntensity: { min: 85 },
        arousal: { min: 70 }
      }
    }
  },
  // ... 其他进化规则
]

function checkEvolution(
  currentPersona: string,
  userProfile: UserAestheticProfile
): string | null {
  const rule = EVOLUTION_RULES.find(r => r.from === currentPersona)
  if (!rule) return null
  
  const { conditions } = rule
  const { dimensions, stability } = userProfile
  
  // 检查收藏数量
  // (这里需要从外部传入 favoriteCount)
  
  // 检查稳定性
  if (stability < conditions.minStability) return null
  
  // 检查维度阈值
  for (const [dim, threshold] of Object.entries(conditions.dimensionThresholds)) {
    const value = dimensions[dim as keyof AestheticDimensions]
    if ('min' in threshold && value < threshold.min!) return null
    if ('max' in threshold && value > threshold.max!) return null
  }
  
  return rule.to
}
```

## 四、成长阶段系统

### 4.1 五阶段模型

```typescript
const GROWTH_STAGES = [
  {
    name: '探索期',
    icon: '🌱',
    range: [0, 4],
    description: '开始发现你的审美偏好',
    features: ['基础测试', '初始人格']
  },
  {
    name: '形成期',
    icon: '🌿',
    range: [5, 19],
    description: '审美画像逐渐清晰',
    features: ['品味光谱', '分类偏好']
  },
  {
    name: '沉浸期',
    icon: '🌳',
    range: [20, 49],
    description: '深度人格解锁',
    features: ['深度人格', '进化提示']
  },
  {
    name: '策展期',
    icon: '🏆',
    range: [50, 99],
    description: '审美体系成熟',
    features: ['策展人认证', '审美报告']
  },
  {
    name: '大师期',
    icon: '👑',
    range: [100, Infinity],
    description: '完整审美画像',
    features: ['完整画像', '年度报告']
  }
]
```

### 4.2 阶段解锁逻辑

```typescript
function getGrowthStage(favoriteCount: number): GrowthStage {
  return GROWTH_STAGES.find(s => 
    favoriteCount >= s.range[0] && favoriteCount <= s.range[1]
  ) || GROWTH_STAGES[0]
}

function getUnlockedFeatures(favoriteCount: number): string[] {
  const stage = getGrowthStage(favoriteCount)
  return GROWTH_STAGES
    .filter(s => s.range[1] <= favoriteCount || s === stage)
    .flatMap(s => s.features)
}
```

## 五、标签与分类的权重系统

### 5.1 标签权重计算

```typescript
interface TagWeight {
  tag: string
  weight: number        // 0-1
  confidence: number    // 0-1
  lastUpdated: number   // timestamp
}

function updateTagWeights(
  currentWeights: Map<string, TagWeight>,
  newFavorite: { tags: string[]; category: string }
): Map<string, TagWeight> {
  const updated = new Map(currentWeights)
  const totalFavorites = currentWeights.size > 0 
    ? Math.max(...Array.from(currentWeights.values()).map(tw => tw.confidence))
    : 0
  
  // 更新标签权重
  newFavorite.tags.forEach(tag => {
    const existing = updated.get(tag)
    if (existing) {
      // 指数移动平均
      existing.weight = existing.weight * 0.9 + 0.1
      existing.confidence = Math.min(1, existing.confidence + 0.05)
      existing.lastUpdated = Date.now()
    } else {
      updated.set(tag, {
        tag,
        weight: 0.1,
        confidence: 0.1,
        lastUpdated: Date.now()
      })
    }
  })
  
  // 衰减未使用的标签
  const decayThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30天
  for (const [tag, tw] of updated.entries()) {
    if (tw.lastUpdated < decayThreshold) {
      tw.weight *= 0.95
      tw.confidence *= 0.9
    }
  }
  
  return updated
}
```

### 5.2 分类偏好计算

```typescript
function calculateCategoryPreferences(
  favorites: Array<{ category: string }>
): Map<string, number> {
  const counts = new Map<string, number>()
  
  favorites.forEach(fav => {
    counts.set(fav.category, (counts.get(fav.category) || 0) + 1)
  })
  
  const total = favorites.length
  const preferences = new Map<string, number>()
  
  for (const [category, count] of counts.entries()) {
    preferences.set(category, count / total)
  }
  
  return preferences
}
```

## 六、完整算法流程

```typescript
interface AestheticSystem {
  // 输入
  favorites: Array<{
    slug: string
    tags: string[]
    category: string
    promptDNA: PromptDNA
  }>
  
  // 处理流程
  process(): UserAestheticProfile {
    // 1. 计算每个收藏的 8 维评分
    const dimensionsList = this.favorites.map(f => 
      calculateDimensions(f.promptDNA)
    )
    
    // 2. 计算用户平均偏好
    const avgDimensions = this.calculateAverage(dimensionsList)
    
    // 3. 更新标签权重
    const tagWeights = this.calculateTagWeights()
    
    // 4. 计算分类偏好
    const categoryPreferences = this.calculateCategoryPreferences()
    
    // 5. 匹配人格
    const matchedPersonas = matchPersona(
      { dimensions: avgDimensions, weights: ..., stability: ..., diversity: ... },
      PERSONA_VECTORS
    )
    
    // 6. 检查进化
    const currentPersona = matchedPersonas[0].persona.id
    const evolvedPersona = checkEvolution(currentPersona, userProfile)
    
    // 7. 确定成长阶段
    const stage = getGrowthStage(this.favorites.length)
    
    return {
      profile: userProfile,
      persona: evolvedPersona || currentPersona,
      stage,
      tagWeights,
      categoryPreferences
    }
  }
}
```

## 七、实施计划

### Phase 1: 基础框架
- [ ] 实现 8 维评分算法
- [ ] 定义 36 种人格的向量坐标
- [ ] 实现余弦相似度匹配

### Phase 2: 动态更新
- [ ] 实现 EMA 更新机制
- [ ] 实现标签权重衰减
- [ ] 实现稳定性计算

### Phase 3: 进化系统
- [ ] 定义 16 条进化规则
- [ ] 实现进化条件检查
- [ ] 实现进化提示 UI

### Phase 4: 可视化
- [ ] 8 维雷达图
- [ ] 成长阶段进度
- [ ] 人格进化动画

## 八、验证指标

### 8.1 算法准确性
- 人格匹配一致性 > 80%
- 维度评分与人工评分相关性 > 0.7
- 进化触发合理性（用户反馈）

### 8.2 用户体验
- 人格描述认同度 > 70%
- 成长阶段感知清晰度
- 推荐内容相关性

---

**下一步**: 先实施 Phase 1，定义 36 种人格的向量坐标，然后实现基础匹配算法。
