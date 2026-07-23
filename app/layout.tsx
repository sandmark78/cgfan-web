import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CGfan - AI 提示词画廊',
  description: '每日精选 AI 提示词和示例图，分门别类，方便查找和复用',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-96x96.png',
    apple: '/apple-touch-icon.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} relative min-h-screen overflow-x-hidden`}>
        {/* 背景层 */}
        <div className="app-bg" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 shell">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
