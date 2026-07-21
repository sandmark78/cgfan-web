import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge'

/**
 * 登出处理
 */
export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
