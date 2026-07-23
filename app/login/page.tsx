import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GitHubSignInButton } from '@/components/auth/github-sign-in-button'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { EmailSignInForm } from '@/components/auth/email-sign-in-form'

export const runtime = 'edge'
export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 已登录，重定向到首页
  if (user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="login-card w-full max-w-sm p-8">
        {/* Logo & 标题 */}
        <div className="relative z-10 text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/20">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            欢迎回到 CGfan
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            登录后可以收藏和点赞你喜欢的提示词
          </p>
        </div>

        {/* 登录按钮 */}
        <div className="relative z-10 space-y-3">
          <GitHubSignInButton />
          <GoogleSignInButton />
        </div>

        {/* 邮箱登录 */}
        <EmailSignInForm />

        {/* 条款 */}
        <p className="relative z-10 mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          登录即表示你同意我们的
          <a href="/terms" className="text-green-600 hover:underline dark:text-green-400">服务条款</a>
          {' '}和{' '}
          <a href="/privacy" className="text-green-600 hover:underline dark:text-green-400">隐私政策</a>
        </p>
      </div>
    </div>
  )
}
