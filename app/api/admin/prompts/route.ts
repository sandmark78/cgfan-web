import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

// GET /api/admin/prompts - 获取所有提示词
export async function GET() {
  try {
    await requireAdmin()
    
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ prompts: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// POST /api/admin/prompts - 创建提示词
export async function POST(request: Request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('prompts')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ prompt: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// PUT /api/admin/prompts/[id] - 更新提示词
export async function PUT(request: Request) {
  try {
    await requireAdmin()
    
    const { id, ...updates } = await request.json()
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ prompt: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

// DELETE /api/admin/prompts/[id] - 删除提示词
export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}
