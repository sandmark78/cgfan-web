import type { Metadata } from 'next';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: {
    default: 'CGfan - Daily Pick · One Prompt, One Image',
    template: '%s | CGfan',
  },
  description: 'Curated AI prompts with examples and notes. Quality over quantity, ready to use.',
};

/**
 * English layout
 */
export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1 min-w-0 max-w-full shell">{children}</main>
      <Footer />
    </>
  )
}
