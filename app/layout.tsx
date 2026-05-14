import type { Metadata, Viewport } from 'next'
import './globals.css'
import AdSense from './components/AdSense'

export const viewport: Viewport = {
  viewportFit: 'cover',
}

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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <AdSense />
        {children}
      </body>
    </html>
  )
}
