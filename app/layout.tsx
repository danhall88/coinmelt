import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ICM — Incentive Compensation',
  description: 'AI-driven comp plan management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
