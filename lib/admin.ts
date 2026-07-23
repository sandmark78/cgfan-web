import { createClient } from '@/lib/supabase/server'

/**
 * 检查当前用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  return !!admin
}

/**
 * 要求管理员权限，否则重定向
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!admin) {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}
