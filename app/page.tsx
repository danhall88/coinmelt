'use client'

import { useState, useEffect } from 'react'
import { coins } from './data/coins'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [prices, setPrices] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [focused, setFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/metals')
      .then(res => res.json())
      .then(data => {
        setPrices(data)
        setLoading(false)
      })
  }, [])
useEffect(() => {
  const stored = localStorage.getItem('coinmelt-recent')
  if (stored) setRecentSearches(JSON.parse(stored))
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
    setResults(matches.slice(0, 8))
  }, [query])

  function getMeltValue(coin: any) {
    if (!prices) return null
    let value = 0
    if (coin.composition.silver) value += coin.composition.silver * prices.silver
    if (coin.composition.gold) value += coin.composition.gold * prices.gold
    return value.toFixed(2)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #1E1E2E', paddingTop: 'env(safe-area-inset-top)', paddingLeft: '24px', paddingRight: '24px', paddingBottom: 0 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FCD34D, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#1a1000', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }}>CM</div>
            <span style={{ fontSize: '17px', fontWeight: '600', color: '#F59E0B' }}>CoinMelt</span>
          </div>
          {loading ? (
            <span style={{ fontSize: '12px', color: '#475569' }}>Loading prices...</span>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gold</div>
                <div style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '600' }}>${prices.gold.toFixed(2)}</div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#1E1E2E' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Silver</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>${prices.silver.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: '700', color: '#F59E0B', margin: '0 0 10px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
            Coin Melt Value Calculator
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
            Live gold & silver prices · 1000+ world coins · Instant results
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search by coin name, country, year, or inscription..."
            style={{
              width: '100%',
              padding: '16px 20px',
              backgroundColor: '#1F2937',
              border: focused ? '1.5px solid #F59E0B' : '1.5px solid #374151',
              borderRadius: '12px',
              color: '#E2E8F0',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              boxShadow: focused ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
            }}
          />
        </div>

        {/* Hint chips */}
        {query.length === 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {(recentSearches.length > 0 ? recentSearches : ['Morgan Dollar', '1964 Kennedy', 'Krugerrand', 'Centenario', 'Sovereign', 'Un Peso']).map(hint => (
                <button
                key={hint}
                onClick={() => setQuery(hint)}
                style={{
                  padding: '5px 12px',
                  backgroundColor: '#111118',
                  border: '1px solid #1E1E2E',
                  borderRadius: '20px',
                  color: '#64748B',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLButtonElement).style.borderColor = '#F59E0B'
                  ;(e.target as HTMLButtonElement).style.color = '#F59E0B'
                }}
                onMouseLeave={e => {
                  (e.target as HTMLButtonElement).style.borderColor = '#1E1E2E'
                  ;(e.target as HTMLButtonElement).style.color = '#64748B'
                }}
              >{hint}</button>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {results.map(coin => {
              const melt = getMeltValue(coin)
              const primaryMetal = coin.composition.gold ? 'gold' : 'silver'
              const accentColor = primaryMetal === 'gold' ? '#F59E0B' : '#94A3B8'
              return (
                <a
                key={coin.id}
  href={`/coin/${coin.id}`}
  onClick={() => {
    const updated = [coin.name, ...recentSearches.filter(s => s !== coin.name)].slice(0, 6)
    setRecentSearches(updated)
    localStorage.setItem('coinmelt-recent', JSON.stringify(updated))
  }}
  style={{
                 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#111118',
                    border: '1px solid #1E1E2E',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = '#F59E0B'
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#13131C'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1E1E2E'
                    ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#111118'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: primaryMetal === 'gold'
                        ? 'radial-gradient(circle at 35% 35%, #FCD34D, #92400E)'
                        : 'radial-gradient(circle at 35% 35%, #E2E8F0, #475569)',
                      boxShadow: primaryMetal === 'gold' ? '0 0 8px rgba(245,158,11,0.3)' : '0 0 8px rgba(148,163,184,0.2)',
                    }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#E2E8F0' }}>{coin.name}</div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '1px' }}>
                        {coin.country} · {coin.years} · {coin.denomination}
                      </div>
                      <div style={{ fontSize: '11px', color: '#334155', marginTop: '1px' }}>
                        {Object.entries(coin.composition).filter(([, oz]) => (oz as number) > 0).map(([metal, oz]) =>
                          `${oz} oz ${metal}`
                        ).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                    {melt && parseFloat(melt) > 0 ? (
                      <>
                        <div style={{ fontSize: '17px', fontWeight: '700', color: accentColor }}>${melt}</div>
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>melt value</div>
                      </>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#334155' }}>No precious metal</div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#334155', fontSize: '14px' }}>
            No coins found — try a different search
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1E1E2E', marginTop: '64px', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#334155' }}>© 2026 CoinMelt · Prices updated every 12 hours</span>
        </div>
      </footer> 

    </div>
  )
}