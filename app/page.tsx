'use client'

import { useState, useEffect } from 'react'
import { coins } from './data/coins'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [prices, setPrices] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metals')
      .then(res => res.json())
      .then(data => {
        setPrices(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const matches = coins.filter(coin =>
      coin.name.toLowerCase().includes(q) ||
      coin.country.toLowerCase().includes(q) ||
      coin.years.toLowerCase().includes(q) ||
      coin.denomination.toLowerCase().includes(q)
    )
    setResults(matches.slice(0, 6))
  }, [query])

  function getMeltValue(coin) {
    if (!prices) return null
    let value = 0
    if (coin.composition.silver) value += coin.composition.silver * prices.silver
    if (coin.composition.gold) value += coin.composition.gold * prices.gold
    return value.toFixed(2)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-16">
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">CoinMelt</h1>
      <p className="text-gray-400 mb-2 text-lg">Instant coin melt value calculator</p>

      {loading ? (
        <p className="text-gray-600 text-sm mb-8">Loading live metal prices...</p>
      ) : (
        <p className="text-gray-600 text-sm mb-8">
          Gold: ${prices.gold.toFixed(2)}/oz · Silver: ${prices.silver.toFixed(2)}/oz
        </p>
      )}

      <div className="w-full max-w-xl">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search any coin — country, name, or year..."
          className="w-full px-5 py-4 rounded-xl bg-gray-800 text-white placeholder-gray-500 text-lg outline-none focus:ring-2 focus:ring-yellow-400"
        />

        {results.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {results.map(coin => (
              <div key={coin.id} className="bg-gray-800 rounded-xl px-5 py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{coin.name}</p>
                  <p className="text-gray-400 text-sm">{coin.country} · {coin.years} · {coin.denomination}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {Object.entries(coin.composition).map(([metal, oz]) =>
                      `${oz} oz ${metal}`
                    ).join(' · ')}
                  </p>
                </div>
                <div className="text-right">
                  {getMeltValue(coin) ? (
                    <>
                      <p className="text-yellow-400 font-bold text-xl">${getMeltValue(coin)}</p>
                      <p className="text-gray-500 text-xs">melt value</p>
                    </>
                  ) : (
                    <p className="text-gray-600 text-sm">loading...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <p className="text-gray-600 text-sm mt-4 text-center">No coins found — try another search</p>
        )}

        {query.length === 0 && (
          <p className="mt-4 text-gray-600 text-sm text-center">Try: "Morgan" or "Mexico" or "1964"</p>
        )}
      </div>
    </main>
  )
}