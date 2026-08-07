/**
 * 国际化翻译文件
 * 用于支持中英文切换
 */

export const translations = {
  zh: {
    // 导航
    nav: {
      explore: '探索',
      daily: '每日一味',
      taste: '美学人格',
      subscribe: '订阅',
      login: '登录',
      logout: '退出',
      dashboard: '控制台',
    },
    // 首页
    home: {
      heroTitle: '每日一味 · 一句提示词，一张图',
      heroDesc: '每天精选一个 AI 提示词，附示例图和策展笔记。不贪多，只选好的，复制即用。',
      browseAll: '浏览全部',
      aestheticPersona: '美学人格',
      personaTooltip: '发现你的美学人格',
      personaDesc: '8 道题，60 秒，找到你的审美基因',
      pastSelections: '往期精选',
      pastSelectionsDesc: '每日精选，持续更新',
      viewAll: '查看全部',
      popularTags: '热门标签',
      latestPrompts: '最新提示词',
    },
    // 探索页
    explore: {
      title: '探索提示词',
      subtitle: '发现适合你的创作灵感',
      allCategories: '全部分类',
      allTags: '全部标签',
      allModels: '全部模型',
      sortBy: '排序',
      sortNewest: '最新',
      sortPopular: '最热',
      sortScore: '评分',
      searchPlaceholder: '搜索提示词...',
      noResults: '没有找到匹配的提示词',
      tryDifferent: '试试其他关键词或筛选条件',
      promptCount: '{count} 个提示词',
    },
    // 详情页
    detail: {
      source: '来源',
      viewOriginal: '查看原文',
      author: '作者',
      category: '分类',
      tags: '标签',
      difficulty: '难度',
      difficultyBeginner: '入门',
      difficultyIntermediate: '进阶',
      difficultyAdvanced: '高级',
      model: '模型',
      prompt: '提示词',
      copyPrompt: '复制提示词',
      copied: '已复制',
      like: '点赞',
      liked: '已点赞',
      favorite: '收藏',
      favorited: '已收藏',
      share: '分享',
      relatedPrompts: '相关提示词',
      generateShareCard: '生成分享卡片',
      shareCardDesc: '下载精美的 Prompt 分享卡片，分享到社交媒体',
    },
    // 分类
    categories: {
      '3d': '3D渲染',
      'abstract': '抽象',
      'architecture': '建筑',
      'design': '设计',
      'editorial': '编辑',
      'fashion': '时尚',
      'guo-feng': '国风',
      'illustration': '插画',
      'minimalist': '极简',
      'photography': '摄影',
      'portrait': '人像',
      'product': '产品',
      'retro': '复古',
      'sci-fi': '科幻',
      'style': '风格',
      'travel': '旅行',
      'dong-man': '动漫',
      'she-ying': '摄影',
    },
    // 通用
    common: {
      loading: '加载中...',
      error: '出错了',
      retry: '重试',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
    },
  },
  en: {
    // Navigation
    nav: {
      explore: 'Explore',
      daily: 'Daily',
      taste: 'Aesthetic Persona',
      subscribe: 'Subscribe',
      login: 'Login',
      logout: 'Logout',
      dashboard: 'Dashboard',
    },
    // Home
    home: {
      heroTitle: 'Daily Pick · One Prompt, One Image',
      heroDesc: 'Curated AI prompts with examples and notes. Quality over quantity, ready to use.',
      browseAll: 'Browse All',
      aestheticPersona: 'Aesthetic Persona',
      personaTooltip: 'Discover your aesthetic persona',
      personaDesc: '8 questions, 60 seconds, find your aesthetic DNA',
      pastSelections: 'Past Selections',
      pastSelectionsDesc: 'Daily picks, continuously updated',
      viewAll: 'View All',
      popularTags: 'Popular Tags',
      latestPrompts: 'Latest Prompts',
    },
    // Explore
    explore: {
      title: 'Explore Prompts',
      subtitle: 'Discover creative inspiration for you',
      allCategories: 'All Categories',
      allTags: 'All Tags',
      allModels: 'All Models',
      sortBy: 'Sort by',
      sortNewest: 'Newest',
      sortPopular: 'Popular',
      sortScore: 'Score',
      searchPlaceholder: 'Search prompts...',
      noResults: 'No matching prompts found',
      tryDifferent: 'Try different keywords or filters',
      promptCount: '{count} prompts',
    },
    // Detail
    detail: {
      source: 'Source',
      viewOriginal: 'View Original',
      author: 'Author',
      category: 'Category',
      tags: 'Tags',
      difficulty: 'Difficulty',
      difficultyBeginner: 'Beginner',
      difficultyIntermediate: 'Intermediate',
      difficultyAdvanced: 'Advanced',
      model: 'Model',
      prompt: 'Prompt',
      copyPrompt: 'Copy Prompt',
      copied: 'Copied',
      like: 'Like',
      liked: 'Liked',
      favorite: 'Favorite',
      favorited: 'Favorited',
      share: 'Share',
      relatedPrompts: 'Related Prompts',
      generateShareCard: 'Generate Share Card',
      shareCardDesc: 'Download beautiful prompt cards to share on social media',
    },
    // Categories
    categories: {
      '3d': '3D Render',
      'abstract': 'Abstract',
      'architecture': 'Architecture',
      'design': 'Design',
      'editorial': 'Editorial',
      'fashion': 'Fashion',
      'guo-feng': 'Chinese Style',
      'illustration': 'Illustration',
      'minimalist': 'Minimalist',
      'photography': 'Photography',
      'portrait': 'Portrait',
      'product': 'Product',
      'retro': 'Retro',
      'sci-fi': 'Sci-Fi',
      'style': 'Style',
      'travel': 'Travel',
      'dong-man': 'Anime',
      'she-ying': 'Photography',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
    },
  },
} as const

export type TranslationKey = typeof translations.zh
export type Locale = keyof typeof translations

/**
 * 获取翻译函数
 */
export function getTranslations(locale: Locale = 'zh') {
  return translations[locale]
}

/**
 * 从请求路径获取语言
 */
export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/en')) {
    return 'en'
  }
  return 'zh'
}
