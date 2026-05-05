import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoinMelt — Instant Coin Melt Value Calculator',
  description: 'Calculate the melt value of any coin instantly. Live gold and silver prices for US and world coins.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9151066365323121"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
