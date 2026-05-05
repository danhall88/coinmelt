'use client'

import { useState, useEffect } from 'react'
import { coins } from './data/coins'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [prices, setPrices] = useState<any>(null)
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
    const words = query.toLowerCase().split(' ').filter(w => w.length > 0)
const matches = coins.filter(coin => {
  const searchText = `${coin.name} ${coin.country} ${coin.years} ${coin.denomination} ${(coin.keywords || []).join(' ')}`.toLowerCase()
  return words.every(word => {
    if (searchText.includes(word)) return true
    // Check if word is a year that falls within the coin's year range
    const yearMatch = coin.years.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/)
    if (yearMatch && /^\d{4}$/.test(word)) {
      const searchYear = parseInt(word)
      const startYear = parseInt(yearMatch[1])
      const endYear = yearMatch[2] === 'present' ? new Date().getFullYear() : parseInt(yearMatch[2])
      return searchYear >= startYear && searchYear <= endYear
    }
    return false
  })
})
    setResults(matches.slice(0, 6))
  }, [query])

  function getMeltValue(coin: any) {
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
          Gold: ${prices.gold.toFixed(2)}/oz · Silver: ${prices.silver.toFixed(2)}/oz · Updated: {new Date(prices.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <a href={`/coin/${coin.id}`} key={coin.id} className="bg-gray-800 rounded-xl px-5 py-4 flex justify-between items-center hover:bg-gray-700 transition-colors cursor-pointer">
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
              </a>
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