import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminDashboard from './AdminDashboard'

export const runtime = 'edge'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = await isAdmin()

  if (!admin) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">无权限访问</h1>
          <p className="text-gray-600">此页面仅限管理员访问</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard user={user} />
}
