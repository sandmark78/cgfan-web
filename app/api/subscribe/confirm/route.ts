import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: '缺少邮箱参数' },
        { status: 400 }
      )
    }

    // TODO: 这里应该更新数据库或 KV 存储，标记邮箱为已确认
    // 目前简单返回成功

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
