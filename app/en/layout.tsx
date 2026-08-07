import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import { ToastProvider } from '@/components/toast'
import Header from '@/components/header';
import Footer from '@/components/footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cgfan.com'),
  title: {
    default: 'CGfan - Daily Pick · One Prompt, One Image',
    template: '%s | CGfan',
  },
  description: 'Curated AI prompts with examples and notes. Quality over quantity, ready to use.',
  openGraph: {
    title: 'CGfan · Daily Pick · One Prompt, One Image',
    description: 'Curated AI prompts with examples and notes. Quality over quantity, ready to use.',
    siteName: 'CGfan',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'CGfan - AI Prompt Gallery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CGfan · Daily Pick · One Prompt, One Image',
    description: 'Curated AI prompts with examples and notes. Quality over quantity, ready to use.',
    images: ['/og-cover.jpg'],
  },
  alternates: {
    canonical: 'https://www.cgfan.com/en',
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

export default function EnglishLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} relative min-h-screen overflow-x-hidden`}>
        {/* Accessibility: Skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-green-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        
        {/* Background layer */}
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
