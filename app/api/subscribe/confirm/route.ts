import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: '缺少邮箱参数' },
        { status: 400 }
      )
    }

    // 更新订阅者状态为已确认
    const { data, error } = await supabase
      .from('subscribers')
      .update({ 
        confirmed: true,
        confirmed_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, message: '确认失败' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: '未找到该订阅' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '订阅已确认',
    })
  } catch (error) {
    console.error('Confirm error:', error)
    return NextResponse.json(
      { success: false, message: '确认失败' },
      { status: 500 }
    )
  }
}
