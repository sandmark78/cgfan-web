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
            .find(row => row.trim().startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : null
        },
        set(name: string, value: string, options: any) {
          const { expires, path, domain, secure, sameSite, ...restOptions } = options
          const cookieOptions = [
            path && `Path=${path}`,
            domain && `Domain=${domain}`,
            secure && 'Secure',
            sameSite && `SameSite=${sameSite}`,
            expires && `Expires=${new Date(expires).toUTCString()}`
          ].filter(Boolean).join('; ')
          
          document.cookie = `${name}=${value}${cookieOptions ? '; ' + cookieOptions : ''}`
        },
        remove(name: string, options: any) {
          const { path, domain } = options
          document.cookie = `${name}=; Path=${path || '/'}; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domain ? `; Domain=${domain}` : ''}`
        },
      },
    }
  )
}
