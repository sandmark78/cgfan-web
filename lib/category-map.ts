/**
 * 分类名中英文映射
 */
export const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  photography: { label: '摄影', icon: '📸' },
  photorealistic: { label: '超写实', icon: '🎯' },
  portrait: { label: '人像', icon: '👤' },
  landscape: { label: '风景', icon: '🏞️' },
  product: { label: '产品', icon: '📦' },
  poster: { label: '海报', icon: '🖼️' },
  editorial: { label: '编辑设计', icon: '📰' },
  illustration: { label: '插画', icon: '🎨' },
  concept_art: { label: '概念艺术', icon: '💡' },
  '3d': { label: '3D渲染', icon: '🎮' },
  anime: { label: '动漫', icon: '🎌' },
  cyberpunk: { label: '赛博朋克', icon: '🌃' },
  'sci-fi': { label: '科幻', icon: '🚀' },
  fantasy: { label: '奇幻', icon: '🧙' },
  retro: { label: '复古', icon: '📼' },
  minimalist: { label: '极简', icon: '⚪' },
  abstract: { label: '抽象', icon: '🎭' },
}

/**
 * 获取分类中文名
 */
export function getCategoryLabel(name: string): string {
  return CATEGORY_MAP[name]?.label || name
}

/**
 * 获取分类图标
 */
export function getCategoryIcon(name: string): string {
  return CATEGORY_MAP[name]?.icon || '📁'
}

/**
 * 获取分类完整显示（图标 + 中文名）
 */
export function getCategoryDisplay(name: string): string {
  const map = CATEGORY_MAP[name]
  if (map) {
    return `${map.icon} ${map.label}`
  }
  return name
}
