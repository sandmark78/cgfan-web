import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const { email } = await request.json()

    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }

    // 发送确认邮件
    const { data, error } = await resend.emails.send({
      from: 'CGfan <noreply@send.cgfan.com>',
      to: [email],
      subject: '确认订阅 CGfan 每日一味',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2D5F3E; font-size: 24px; margin-bottom: 16px;">欢迎订阅 CGfan 每日一味</h1>
          <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            感谢你的订阅！每天我们会为你精选一个 AI 提示词，附上策展笔记和实用技巧。
          </p>
          <p style="color: #4A4A4A; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            点击下方按钮确认订阅：
          </p>
          <a href="https://www.cgfan.com/subscribe/confirm?email=${encodeURIComponent(email)}" style="display: inline-block; background: #2D5F3E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            确认订阅
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 32px;">
            如果你没有订阅 CGfan，请忽略这封邮件。
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { success: false, message: '发送失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '订阅成功！请查收确认邮件',
      data,
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误，请稍后重试' },
      { status: 500 }
    )
  }
}
