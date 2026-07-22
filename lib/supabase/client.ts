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
            .split(';')
            .find(c => c.trim().startsWith(`${name}=`))
          return cookie ? cookie.trim().substring(name.length + 1) : null
        },
        set(name: string, value: string, options: any = {}) {
          // 检测当前协议，决定是否设置 Secure 属性
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
          
          // 默认设置，确保适用于 PKCE 流程
          const cookieOptions = {
            path: '/',
            sameSite: 'lax',
            ...options
          }
          
          // 只 HTTPS 环境才设置 Secure 属性
          if (isSecure) {
            cookieOptions.secure = true
          }
          
          // 构建 cookie 字符串
          const cookieParts = [
            `${name}=${value}`,
            `path=${cookieOptions.path}`,
            cookieOptions.domain ? `domain=${cookieOptions.domain}` : null,
            cookieOptions.secure ? 'secure' : null,
            `samesite=${cookieOptions.sameSite}`,
            cookieOptions.expires ? `expires=${new Date(cookieOptions.expires).toUTCString()}` : null
          ].filter(Boolean)
          
          document.cookie = cookieParts.join('; ')
        },
        remove(name: string, options: any = {}) {
          const cookieOptions = {
            path: '/',
            ...options
          }
          
          document.cookie = `${name}=; Path=${cookieOptions.path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT${cookieOptions.domain ? `; Domain=${cookieOptions.domain}` : ''}`
        },
      },
    }
  )
}
