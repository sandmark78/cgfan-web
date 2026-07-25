/**
 * 品味分析引擎 - 基于收藏数据分析用户审美偏好
 */

import { TasteAnalysis } from './personas'

export interface FavoriteItem {
  slug: string
  title: string
  category: string
  tags: string[]
  model: string
  image: string
  ts: number
}

const STORAGE_KEY = 'cgfan-favs'

/**
 * 分析用户收藏的品味偏好
 */
export function analyzeTaste(favorites: FavoriteItem[]): TasteAnalysis {
  const catCount: Record<string, number> = {}
  const tagCount: Record<string, number> = {}

  favorites.forEach(f => {
    if (!f.category) return
    catCount[f.category] = (catCount[f.category] || 0) + 1
    ;(f.tags || []).forEach(t => (tagCount[t] = (tagCount[t] || 0) + 1))
  })

  const total = favorites.filter(f => f.category).length || 1

  const categories = Object.entries(catCount)
    .map(([name, count]) => ({ name, ratio: count / total, count }))
    .sort((a, b) => b.ratio - a.ratio)

  const topTags = Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const tagSet = new Set(topTags.map(t => t.name))

  return {
    categories,
    topTags,
    total,
    tagSet,
    cat: (kw: string) => categories.find(c => c.name.includes(kw))?.ratio || 0,
    hasTags: (list: string[]) => list.filter(t => tagSet.has(t)).length,
  }
}

/**
 * 读取 localStorage 中的收藏（带容错）
 * 兼容旧格式（纯 slug 数组）→ 自动迁移为新格式
 */
export function readFavorites(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    // 旧格式：纯 slug 数组 → 自动迁移
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      const migrated: FavoriteItem[] = (parsed as string[]).map(slug => ({
        slug,
        title: '',
        category: '',
        tags: [],
        model: '',
        image: '',
        ts: 0,
      }))
      // 写回新格式
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return parsed as FavoriteItem[]
  } catch {
    return []
  }
}

/**
 * 保存收藏到 localStorage
 */
export function saveFavorite(item: FavoriteItem): void {
  const favs = readFavorites()
  // 如果旧格式迁移来的空对象，替换为完整数据
  const existingIndex = favs.findIndex(f => f.slug === item.slug)
  if (existingIndex >= 0) {
    favs[existingIndex] = item
  } else {
    favs.push(item)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
}

/**
 * 移除收藏
 */
export function removeFavorite(slug: string): void {
  const favs = readFavorites().filter(f => f.slug !== slug)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs))
}

/**
 * 检查是否已收藏
 */
export function isFavorited(slug: string): boolean {
  return readFavorites().some(f => f.slug === slug)
}