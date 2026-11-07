import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ProgressBar from '@/components/ProgressBar'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'MotionGraphicPrompts — Turn Ideas Into Motion',
  description:
    'Turn any topic into viral motion graphic prompts. Professionally structured for Google Flow (Veo), ready in 2 minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-[#111111] antialiased">
        <ProgressBar />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
