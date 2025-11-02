import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Voice AI Agent',
  description: 'AI agent powered by voice interaction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
