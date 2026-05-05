'use client'

import { useState, useEffect } from 'react'

export default function CoinCalculator({ coin }: { coin: any }) {
  const [prices, setPrices] = useState<any>(null)

  useEffect(() => {
    fetch('/api/metals')
      .then(res => res.json())
      .then(data => setPrices(data))
  }, [])

  function getMeltValue() {
    if (!prices) return null
    let value = 0
    if (coin.composition.silver) value += coin.composition.silver * prices.silver
    if (coin.composition.gold) value += coin.composition.gold * prices.gold
    return value.toFixed(2)
  }

  return (
    <>
      <div className="bg-gray-800 rounded-2xl p-6 mb-4">
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

      <div className="bg-gray-800 rounded-2xl p-6 mb-4">
        <p className="text-gray-400 text-sm mb-3">Metal Content</p>
        {Object.entries(coin.composition).map(([metal, oz]) => (
          <div key={metal} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
            <span className="capitalize text-white">{metal}</span>
            <span className="text-gray-300">{oz as number} troy oz</span>
          </div>
        ))}
      </div>

      {coin.alloy && Object.keys(coin.alloy).length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-6 mb-4">
          <p className="text-gray-400 text-sm mb-3">Alloy Composition</p>
          {Object.entries(coin.alloy).map(([metal, pct]) => (
            <div key={metal} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
              <span className="capitalize text-white">{metal}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-yellow-400 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-gray-300 w-12 text-right">{pct as number}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(coin.weight > 0 || coin.diameter > 0) && (
        <div className="bg-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-3">Physical Specifications</p>
          {coin.weight > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-white">Weight</span>
              <span className="text-gray-300">{coin.weight} g</span>
            </div>
          )}
          {coin.diameter > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-white">Diameter</span>
              <span className="text-gray-300">{coin.diameter} mm</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}