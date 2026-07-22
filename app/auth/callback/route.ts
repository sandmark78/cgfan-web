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
    try {
      const supabase = await createClient()
      const { error, data } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth exchange error:', error)
        console.error('Error details:', {
          code: code ? 'present' : 'missing',
          error_message: error.message,
          error_code: error.code,
          origin: origin
        })
        // 重定向到登录页，带错误信息
        redirect(`${origin}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`)
      }
      
      // 成功，重定向到目标页面
      redirect(next)
    } catch (err) {
      console.error('OAuth callback exception:', err)
      redirect(`${origin}/login?error=exception`)
    }
  }

  // 没有 code，重定向到登录页
  redirect(`${origin}/login?error=no_code`)
}
