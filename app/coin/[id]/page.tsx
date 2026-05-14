import { coins } from '../../data/coins'
import CoinPageClient from './CoinPageClient'

export async function generateStaticParams() {
  return coins.map(coin => ({ id: coin.id }))
}

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coin = coins.find(c => c.id === id)

  if (!coin) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#94A3B8' }}>Coin not found</p>
    </div>
  )

  return <CoinPageClient coin={coin} />
}
