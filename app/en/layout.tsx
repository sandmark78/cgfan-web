import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'CGfan - Daily Pick · One Prompt, One Image',
    template: '%s | CGfan',
  },
  description: 'Curated AI prompts with examples and notes. Quality over quantity, ready to use.',
};

/**
 * English layout - no nested html/body tags
 */
export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
