/**
 * 每日一味 - 策展数据
 * 每天推荐一个 prompt，附带策展笔记
 */

export interface DailyFeature {
  date: string // YYYY-MM-DD
  slug: string
  curatorNote: string
  highlight?: string // 一句话亮点
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
  },
  {
    date: '2026-07-24',
    slug: 'retro-vector-travel-poster',
    curatorNote:
      '复古未来主义旅行海报。关键技巧：用 "risograph print" 模拟孔版印刷的颗粒感，配合 "limited color palette" 限制配色，反而比堆砌细节更有味道。',
    highlight: '限制配色，反而更有味道',
  },
  {
    date: '2026-07-23',
    slug: 'cyberpunk-street-food',
    curatorNote:
      '赛博朋克街景。这个 prompt 的精髓在于 "neon reflection on wet pavement"——不是直接画霓虹灯，而是画霓虹灯在湿地面上的倒影。间接表现比直接堆砌更高级。',
    highlight: '间接表现比直接堆砌更高级',
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
