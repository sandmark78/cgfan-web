'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LikeButtonProps {
  promptSlug: string
  userId?: string
  initialLiked?: boolean
  initialCount?: number
  isAuthenticated?: boolean
}

/**
 * 点赞按钮
 */
export function LikeButton({
  promptSlug,
  userId,
  initialLiked = false,
  initialCount = 0,
  isAuthenticated = false,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    if (!userId) {
      console.error('用户 ID 不存在')
      return
    }

    setLoading(true)
    try {
      if (liked) {
        // 取消点赞
        await supabase
          .from('likes')
          .delete()
          .eq('prompt_slug', promptSlug)
          .eq('user_id', userId)

        setCount((c) => c - 1)
        setLiked(false)
      } else {
        // 点赞
        await supabase
          .from('likes')
          .insert({ prompt_slug: promptSlug, user_id: userId })

        setCount((c) => c + 1)
        setLiked(true)
      }
    } catch (err) {
      console.error('点赞失败:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
        liked
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
      }`}
    >
      <svg
        className={`h-4 w-4 ${liked ? 'fill-current' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count}</span>
    </button>
  )
}
