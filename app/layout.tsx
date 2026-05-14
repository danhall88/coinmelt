import type { Metadata, Viewport } from 'next'
import './globals.css'

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
        <script dangerouslySetInnerHTML={{
          __html: `
            if (!window.navigator.userAgent.includes('Capacitor')) {
              var s = document.createElement('script');
              s.async = true;
              s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9151066365323121';
              s.crossOrigin = 'anonymous';
              document.head.appendChild(s);
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}