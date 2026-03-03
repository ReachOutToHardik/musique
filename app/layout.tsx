import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import StarsBackground from '@/components/StarsBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Musique - Real-time Music Trivia',
  description: 'Compete with friends in real-time music trivia battles',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} noise`}>
        <div className="ambient-bg" />
        <StarsBackground />
        {children}
      </body>
    </html>
  )
}
