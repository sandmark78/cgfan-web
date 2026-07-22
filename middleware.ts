import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware: 刷新 Supabase Auth Session
 * 确保每个请求都有最新的认证状态
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions: any = {
              maxAge: options.maxAge,
              expires: options.expires,
              path: options.path ?? '/',
              domain: options.domain,
              httpOnly: options.httpOnly,
              secure: options.secure,
              sameSite: options.sameSite,
            }
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // 刷新 session
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public 静态资源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
