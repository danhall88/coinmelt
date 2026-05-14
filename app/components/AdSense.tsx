'use client'

import { useEffect } from 'react'

export default function AdSense() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Capacitor) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9151066365323121'
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }
  }, [])

  return null
}
