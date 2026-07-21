import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

/**
 * 用户菜单组件
 * 显示登录状态和用户操作
 */
export default async function UserMenu() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        登录
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        {user.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.name || 'User'}
            className="h-6 w-6 rounded-full"
          />
        )}
        <span>{user.user_metadata?.name || user.email}</span>
      </Link>
      <Link
        href="/logout"
        className="text-sm text-white/70 transition-colors hover:text-white"
      >
        登出
      </Link>
    </div>
  )
}
