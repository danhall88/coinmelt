import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: {
    default: 'CoinMelt — Instant Coin Melt Value Calculator',
    template: '%s — CoinMelt',
  },
  description: 'Calculate the melt value of any coin instantly. Live gold and silver prices for US and world coins.',
  metadataBase: new URL('https://coinmelt.app'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9151066365323121"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}