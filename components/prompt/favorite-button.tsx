'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveFavorite, removeFavorite, isFavorited, FavoriteItem } from '@/lib/taste'

interface FavoriteButtonProps {
  prompt: {
    slug: string
    title: string
    category: string
    tags: string[]
    model: string
    cover: string
  }
  userId?: string
  initialFavorited?: boolean
  isAuthenticated?: boolean
}

/**
 * 收藏按钮 - 支持 localStorage 和 Supabase 双模式
 */
export function FavoriteButton({
  prompt,
  userId,
  initialFavorited = false,
  isAuthenticated = false,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 检查 localStorage 状态
    if (!isAuthenticated) {
      setFavorited(isFavorited(prompt.slug))
    }
  }, [prompt.slug, isAuthenticated])

  const handleToggle = async () => {
    // 未登录时用 localStorage
    if (!isAuthenticated) {
      if (favorited) {
        removeFavorite(prompt.slug)
      } else {
        const item: FavoriteItem = {
          slug: prompt.slug,
          title: prompt.title,
          category: prompt.category,
          tags: prompt.tags,
          model: prompt.model,
          image: prompt.cover,
          ts: Date.now(),
        }
        saveFavorite(item)
      }
      setFavorited(!favorited)
      return
    }

    if (!userId) {
      console.error('用户 ID 不存在')
      return
    }

    setLoading(true)
    try {
      if (favorited) {
        // 取消收藏
        await supabase
          .from('favorites')
          .delete()
          .eq('prompt_slug', prompt.slug)
          .eq('user_id', userId)

        setFavorited(false)
      } else {
        // 收藏
        await supabase
          .from('favorites')
          .insert({ prompt_slug: prompt.slug, user_id: userId })

        setFavorited(true)
      }
    } catch (err) {
      console.error('收藏失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
        favorited
          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
      }`}
    >
      <svg
        className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`}
        fill={favorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>{favorited ? '已收藏' : '收藏'}</span>
    </button>
  )
}
