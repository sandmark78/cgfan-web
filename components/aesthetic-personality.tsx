'use client'

import { useState, useEffect } from 'react'

interface AestheticPersonalityProps {
  allPrompts: Array<{
    slug: string
    title: string
    tags: string[]
    category: string
    cover: string
  }>
}

interface AestheticProfile {
  categories: Record<string, number>
  tags: Record<string, number>
  keywords: string[]
  personality: string
  description: string
}

/**
 * 美学人格 - 基于用户收藏/点赞生成审美画像
 */
export function AestheticPersonality({ allPrompts }: AestheticPersonalityProps) {
  const [profile, setProfile] = useState<AestheticProfile | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取收藏和点赞记录
    const favorites = JSON.parse(localStorage.getItem('cgfan_favorites') || '[]')
    const likes = JSON.parse(localStorage.getItem('cgfan_likes') || '[]')

    if (favorites.length + likes.length >= 5) {
      const profile = analyzeAesthetic(favorites, likes, allPrompts)
      setProfile(profile)
      setShowResult(true)
    }
  }, [allPrompts])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const favorites = JSON.parse(localStorage.getItem('cgfan_favorites') || '[]')
      const likes = JSON.parse(localStorage.getItem('cgfan_likes') || '[]')
      const profile = analyzeAesthetic(favorites, likes, allPrompts)
      setProfile(profile)
      setShowResult(true)
      setIsGenerating(false)
    }, 1000)
  }

  if (!showResult) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="mb-4 text-4xl">🎨</div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          发现你的 AI 美学人格
        </h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          收藏或点赞 5 个以上的提示词，生成你的专属审美画像
        </p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50"
        >
          {isGenerating ? '分析中...' : '生成美学画像'}
        </button>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
      <div className="mb-6 text-center">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400">
          你的 AI 美学基因
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {profile.personality}
        </h3>
      </div>

      {/* 分类分布 */}
      <div className="mb-6 space-y-3">
        {Object.entries(profile.categories)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, count]) => {
            const total = Object.values(profile.categories).reduce((a, b) => a + b, 0)
            const percentage = Math.round((count / total) * 100)
            return (
              <div key={category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {category}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/50 dark:bg-gray-800/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>

      {/* 审美关键词 */}
      <div className="mb-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          你的审美关键词
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm dark:bg-gray-800/60 dark:text-gray-300"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 人格描述 */}
      <div className="rounded-xl bg-white/40 p-4 backdrop-blur-sm dark:bg-gray-800/40">
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {profile.description}
        </p>
      </div>

      {/* 分享按钮 */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            const text = `我的 AI 美学人格是「${profile.personality}」✨\n\n${profile.description}\n\n来 CGfan 发现你的审美基因 → cgfan-web.pages.dev`
            navigator.clipboard.writeText(text)
            alert('已复制到剪贴板，快去分享吧！')
          }}
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-lg"
        >
          分享我的美学基因
        </button>
      </div>
    </div>
  )
}

function analyzeAesthetic(
  favorites: string[],
  likes: string[],
  allPrompts: AestheticPersonalityProps['allPrompts']
): AestheticProfile {
  const promptMap = new Map(allPrompts.map((p) => [p.slug, p]))
  const categories: Record<string, number> = {}
  const tags: Record<string, number> = {}

  // 分析收藏和点赞的提示词
  const analyzedSlugs = [...new Set([...favorites, ...likes])]

  analyzedSlugs.forEach((slug) => {
    const prompt = promptMap.get(slug)
    if (!prompt) return

    // 统计分类
    categories[prompt.category] = (categories[prompt.category] || 0) + 1

    // 统计标签
    prompt.tags.forEach((tag) => {
      tags[tag] = (tags[tag] || 0) + 1
    })
  })

  // 获取 top 关键词
  const keywords = Object.entries(tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag)

  // 根据分类和标签生成人格
  const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0]?.[0] || 'mixed'
  const personality = getPersonalityType(topCategory, keywords)
  const description = getPersonalityDescription(personality)

  return {
    categories,
    tags,
    keywords,
    personality,
    description,
  }
}

function getPersonalityType(category: string, keywords: string[]): string {
  // 根据主要分类和关键词生成人格类型
  if (category === 'realistic' || keywords.includes('写实')) {
    return '写实主义者'
  }
  if (category === '3d' || keywords.includes('3D')) {
    return '空间建筑师'
  }
  if (category === 'anime' || keywords.includes('动漫')) {
    return '二次元造梦师'
  }
  if (keywords.includes('赛博朋克') || keywords.includes('cyberpunk')) {
    return '未来主义者'
  }
  if (keywords.includes('微缩') || keywords.includes('miniature')) {
    return '细节控'
  }
  if (keywords.includes('胶片') || keywords.includes('film')) {
    return '时光收藏家'
  }
  return '美学探索者'
}

function getPersonalityDescription(personality: string): string {
  const descriptions: Record<string, string> = {
    写实主义者:
      '你追求真实与细节，相信最好的艺术是对现实的完美再现。在你的眼中，每一束光线、每一处阴影都有其存在的意义。',
    空间建筑师:
      '你对三维空间有着天然的敏感度，喜欢在虚拟世界中构建令人惊叹的场景。你的想象力不受物理法则的限制。',
    二次元造梦师:
      '你活在现实与幻想的交界处，用动漫的视角重新诠释世界。对你来说，每个角色都有灵魂，每帧画面都是故事。',
    未来主义者:
      '你着迷于科技与人文的碰撞，在赛博朋克的霓虹灯下寻找人性的光芒。你的审美前卫而独特。',
    细节控:
      '你是微观世界的观察者，相信伟大藏在细节里。一个小小的元素就能让你驻足良久，发现别人忽略的美。',
    时光收藏家:
      '你对复古与怀旧有着独特的情感，喜欢用胶片质感记录时光的痕迹。在你的世界里，每一张照片都承载着一段记忆。',
    美学探索者:
      '你是开放的美学冒险家，不被任何单一风格定义。你的品味多元而包容，总是在寻找下一个让你心动的视觉体验。',
  }

  return descriptions[personality] || descriptions['美学探索者']
}
