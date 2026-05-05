'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { coins } from '@/app/data/coins'

export default function CoinPage() {
  const params = useParams()
  const id = params.id as string
  const [prices, setPrices] = useState<any>(null)
  const coin = coins.find(c => c.id === id)

  useEffect(() => {
    fetch('/api/metals')
      .then(res => res.json())
      .then(data => setPrices(data))
  }, [])

  if (!coin) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Coin not found</p>
    </main>
  )

  function getMeltValue() {
    if (!prices) return null
    let value = 0
    if (coin!.composition.silver) value += coin!.composition.silver * prices.silver
    if (coin!.composition.gold) value += coin!.composition.gold * prices.gold
    return value.toFixed(2)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-16">
      <a href="/" className="text-yellow-400 text-sm mb-8 hover:underline">← Back to search</a>

      <div className="w-full max-w-xl">
        <p className="text-gray-400 text-sm mb-1">{coin.country}</p>
        <h1 className="text-3xl font-bold text-white mb-1">{coin.name}</h1>
        <p className="text-gray-500 mb-8">{coin.years} · {coin.denomination}</p>

        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-1">Melt Value</p>
          <p className="text-yellow-400 text-5xl font-bold">
            {getMeltValue() ? `$${getMeltValue()}` : 'Loading...'}
          </p>
          {prices && (
            <p className="text-gray-600 text-xs mt-2">
              Gold: ${prices.gold.toFixed(2)}/oz · Silver: ${prices.silver.toFixed(2)}/oz
            </p>
          )}
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-3">Metal Composition</p>
          {Object.entries(coin.composition).map(([metal, oz]) => (
            <div key={metal} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="capitalize text-white">{metal}</span>
              <span className="text-gray-300">{oz as number} troy oz</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}