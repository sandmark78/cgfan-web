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
  metadataBase: new URL('https://cgfan-web.pages.dev'),
  title: {
    default: 'CGfan - 每日一味，一句咒语一张图',
    template: '%s | CGfan',
  },
  description:
    'CGfan — 每日精选 AI 提示词与示例图。涵盖写实、动漫、3D、摄影等风格，附策展笔记和参数解析，支持 GPT-Image、Midjourney 等模型，一键复制即用。',
  openGraph: {
    title: 'CGfan · 每日一味，一句咒语一张图',
    description: '每日精选 AI 提示词与示例图鉴，附策展笔记，复制即用。',
    siteName: 'CGfan',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'CGfan - AI 提示词画廊',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CGfan · 每日一味，一句咒语一张图',
    description: '每日精选 AI 提示词与示例图鉴，附策展笔记，复制即用。',
    images: ['/og-cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-96x96.png',
    apple: '/apple-touch-icon.png',
  },
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
        {/* 可访问性：跳到主要内容 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-green-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          跳到主要内容
        </a>
        
        {/* 背景层 */}
        <div className="app-bg" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1 shell">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
