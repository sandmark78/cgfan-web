'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * 浏览器端 Supabase 客户端
 * 用于客户端组件（'use client'）
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : null
        },
        set(name: string, value: string, options: any) {
          const { expires, ...restOptions } = options
          const cookieOptions = {
            ...restOptions,
            expires: expires ? new Date(expires) : undefined,
          }
          document.cookie = `${name}=${value}; ${Object.entries(cookieOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`
        },
        remove(name: string, options: any) {
          const { expires, ...restOptions } = options
          const cookieOptions = {
            ...restOptions,
            expires: new Date(0),
          }
          document.cookie = `${name}=; ${Object.entries(cookieOptions).map(([k, v]) => `${k}=${v}`).join('; ')}`
        },
      },
    }
  )
}
