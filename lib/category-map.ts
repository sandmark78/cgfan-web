/**
 * 分类名中英文映射
 */
export const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  realistic: { label: '写实风格', icon: '📷' },
  anime: { label: '动漫风格', icon: '🎨' },
  '3d': { label: '3D 渲染', icon: '🎮' },
  abstract: { label: '抽象', icon: '🎭' },
  cyberpunk: { label: '赛博朋克', icon: '🌃' },
  portrait: { label: '人物', icon: '👤' },
  landscape: { label: '风景', icon: '🏔️' },
  style: { label: '风格', icon: '🎨' },
  photography: { label: '摄影', icon: '📸' },
  product: { label: '产品', icon: '📦' },
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
