import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ToastProvider } from '@/components/toast'
import Header from '@/components/header';
import Footer from '@/components/footer';

// 本地字体：NotoSerifSC（从Google Fonts迁移到本地，避免构建时拉取失败）
const notoSerif = localFont({
  src: '../public/fonts/NotoSerifSC-Regular.woff2',
  variable: '--font-serif',
  weight: '400',
  display: 'swap',
});

// 系统字体栈替代Geist（避免外部依赖）
const systemSans = `
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif
`;
const systemMono = `
  'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace
`;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cgfan.com'),
  title: {
    default: 'CGfan - 每日一味 · 一句提示词，一张图',
    template: '%s | CGfan',
  },
  description: '每天精选一个 AI 提示词，附示例图和策展笔记。不贪多，只选好的，复制即用。',
  openGraph: {
    title: 'CGfan · 每日一味 · 一句提示词，一张图',
    description: '每天精选一个 AI 提示词，附示例图和策展笔记。不贪多，只选好的，复制即用。',
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
    title: 'CGfan · 每日一味 · 一句提示词，一张图',
    description: '每天精选一个 AI 提示词，附示例图和策展笔记。不贪多，只选好的，复制即用。',
    images: ['/og-cover.jpg'],
  },
  alternates: {
    canonical: 'https://www.cgfan.com',
    types: {
      'application/rss+xml': '/daily/feed.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-96x96.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`h-full antialiased`}
      style={{
        '--font-sans': systemSans,
        '--font-mono': systemMono,
      } as React.CSSProperties}
    >
      <body className={`${notoSerif.variable} relative min-h-screen overflow-x-hidden`}>
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
          <ToastProvider>
          <Header />
          <main id="main-content" className="flex-1 min-w-0 max-w-full shell">{children}</main>
          <Footer />
        </ToastProvider>
        </div>
        
        {/* Cloudflare Web Analytics */}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "b3419fe62445420c9cf31765383efa71"}'
        />
      </body>
    </html>
  );
}
