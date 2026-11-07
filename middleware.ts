import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware: 刷新 Supabase Auth Session
 * 优化：只在需要认证的页面运行，添加缓存避免频繁调用
 */
export async function middleware(request: NextRequest) {
  // 只对需要认证的路径运行 middleware
  const needsAuth = request.nextUrl.pathname.startsWith('/admin') || 
                    request.nextUrl.pathname.startsWith('/dashboard') ||
                    request.nextUrl.pathname.startsWith('/api/admin')

  if (!needsAuth) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              path: '/',
              ...options,
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // 只在需要认证的路径刷新 session
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 只对需要认证的路径运行 middleware：
     * - /admin/* (管理后台)
     * - /dashboard/* (用户面板)
     * - /api/admin/* (管理 API)
     */
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
}
