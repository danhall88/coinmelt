import { coins } from './data/coins'

export default function sitemap() {
  const coinUrls = coins.map(coin => ({
    url: `https://coinmelt.app/coin/${coin.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://coinmelt.app',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...coinUrls,
  ]
}