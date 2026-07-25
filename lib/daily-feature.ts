/**
 * 每日一味 - 策展数据
 * 每天推荐一个 prompt，附带策展笔记
 */

export interface DailyFeature {
  date: string // YYYY-MM-DD
  slug: string
  curatorNote: string
  highlight?: string // 一句话亮点
  tip?: string // 实用技巧
  technique?: string // 关键技法
  tryChange?: string // 试着改一个词
}

/**
 * 每日一味映射表
 * 格式：日期 -> { slug, 策展笔记, 亮点 }
 */
export const dailyFeatures: DailyFeature[] = [
  {
    date: '2026-07-25',
    slug: 'bottle-city-miniature',
    curatorNote:
      '这个 prompt 的灵感来自日本"箱庭"微缩艺术。作者试了 14 次才把玻璃瓶的折射感调对，关键是把 "subsurface scattering" 换成 "caustic light refraction"——一个词的差别，光就活了。',
    highlight: '一个词的差别，光就活了',
    technique: '焦散光 · 微距 · 暖冷对比',
    tip: '写玻璃材质时，避免用 "transparent"——太普通。用 "caustic light refraction" 或 "light dispersion through glass" 会让模型自动计算光的折射路径。',
    tryChange: '把 "warm sunset" 换成 "cold morning"，整座城的情绪会完全不同',
  },
  {
    date: '2026-07-24',
    slug: 'retro-futuristic-vector-travel-poster',
    curatorNote:
      '复古未来主义旅行海报。关键技巧：用 "risograph print" 模拟孔版印刷的颗粒感，配合 "limited color palette" 限制配色，反而比堆砌细节更有味道。',
    highlight: '限制配色，反而更有味道',
    technique: '孔版印刷 · 有限配色 · 矢量排版',
    tip: '"risograph print" 是复古海报的核武器——它让 AI 模拟孔版印刷的套色不准和颗粒感，比直接写 "retro style" 精准十倍。',
    tryChange: '把配色从 "teal + orange" 换成 "red + cream"，整张海报的时代感会从 60 年代跳到 80 年代。',
  },
  {
    date: '2026-07-23',
    slug: '3d-capsule-toy-kawaii-diorama',
    curatorNote:
      '3D 胶囊玩具风格的城市微缩场景。这个 prompt 的精髓在于 "kawaii urban diorama"——把可爱和都市感结合，用 tilt-shift 镜头营造微缩模型的错觉。',
    highlight: '可爱与都市的完美融合',
    technique: '移轴摄影 · 微缩模型 · 日系可爱',
    tip: '想做出"玩具感"的关键词是 "tilt-shift" 和 "macro photography"——前者模拟微缩模型的景深错觉，后者让细节放大到像真的在拍一个实体模型。',
    tryChange: '把 "sunny day" 换成 "rainy night"，城市微缩从玩具店橱窗变成赛博朋克街机。',
  },
]

/**
 * 获取今日推荐
 */
export function getTodayFeature(): DailyFeature | null {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return dailyFeatures.find((f) => f.date === today) || null
}

/**
 * 获取指定日期的推荐
 */
export function getFeatureByDate(date: string): DailyFeature | null {
  return dailyFeatures.find((f) => f.date === date) || null
}

/**
 * 获取所有每日一味（按日期降序）
 */
export function getAllFeatures(): DailyFeature[] {
  return [...dailyFeatures].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * 获取昨天的推荐
 */
export function getYesterdayFeature(): DailyFeature | null {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  return getFeatureByDate(dateStr)
}

/**
 * 获取明天的推荐（如果有的话）
 */
export function getTomorrowFeature(): DailyFeature | null {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]
  return getFeatureByDate(dateStr)
}
