import { createClient } from '@/lib/supabase/server'

// 管理员邮箱列表（从环境变量读取）
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || ['sandmark78@gmail.com']

/**
 * 检查当前用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return false

  return ADMIN_EMAILS.includes(user.email)
}

/**
 * 要求管理员权限，否则抛出错误
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}
