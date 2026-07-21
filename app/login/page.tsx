import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GitHubSignInButton } from '@/components/auth/github-sign-in-button'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export const runtime = 'edge'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 已登录，重定向到首页
  if (user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            登录 CGfan
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            登录后可以收藏和点赞你喜欢的提示词
          </p>
        </div>

        <div className="space-y-4">
          <GitHubSignInButton />
          <GoogleSignInButton />
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          登录即表示你同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  )
}
