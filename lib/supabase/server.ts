import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 服务端 Supabase 客户端
 * 用于 Server Components、Route Handlers、Server Actions
 * Next.js 16: cookies() 是异步的
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 中无法设置 cookie，忽略
            // 这在 Middleware 中会处理
          }
        },
      },
    }
  )
}
