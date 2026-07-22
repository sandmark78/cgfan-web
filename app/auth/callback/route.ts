import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

/**
 * OAuth 回调处理
 * 处理 Supabase Auth 的回调，重定向到首页
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
  }

  // 认证失败，重定向到登录页
  redirect(`${origin}/login?error=auth_failed`)
}
