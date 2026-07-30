import type { Metadata } from 'next'
import SubscribePageClient from './SubscribePageClient'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '订阅更新 | CGfan',
  description: '通过邮件或 RSS 订阅 CGfan 的每日一味更新',
}

export default function SubscribePage() {
  return <SubscribePageClient />
}
