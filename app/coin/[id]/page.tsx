'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { coins } from '../../data/coins'

function ReportError({ coinName }: { coinName: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch('https://formspree.io/f/xqenboyd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin: coinName, message }),
      })
      setSent(true)
    } catch {
      setSent(true)
    }
    setSending(false)
  }

  if (sent) return (
    <div style={{ marginTop: '24px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#94A3B8' }}>Thanks — we'll review and fix it.</p>
    </div>
  )

  return (
    <div style={{ marginTop: '24px' }}>
      {!open ? (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setOpen(true)}
            style={{ fontSize: '13px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Report an error with this coin
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Report an Error</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What's wrong? (e.g. incorrect silver content, wrong years, missing mint mark)"
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#0A0A0F',
              border: '1px solid #1E1E2E',
              borderRadius: '8px',
              padding: '10px',
              color: '#E2E8F0',
              fontSize: '13px',
              fontFamily: 'system-ui, sans-serif',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ fontSize: '12px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={sending}
              style={{
                fontSize: '12px', color: '#0A0A0F', backgroundColor: '#F59E0B',
                border: 'none', borderRadius: '6px', padding: '6px 14px',
                cursor: 'pointer', fontWeight: '600'
              }}
            >
              {sending ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ color: '#94A3B8' }}>Coin not found</p>
    </div>
  )

  function getMeltValue() {
    if (!prices) return null
    let value = 0
    if (coin!.composition.silver) value += coin!.composition.silver * prices.silver
    if (coin!.composition.gold) value += coin!.composition.gold * prices.gold
    return value.toFixed(2)
  }

  const primaryMetal = coin.composition.gold ? 'gold' : 'silver'
  const accentColor = primaryMetal === 'gold' ? '#F59E0B' : '#94A3B8'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #1E1E2E', paddingTop: 'env(safe-area-inset-top)', paddingLeft: '24px', paddingRight: '24px', paddingBottom: 0 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #FCD34D, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#1a1000', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }}>CM</div>
            <span style={{ fontSize: '17px', fontWeight: '600', color: '#F59E0B' }}>CoinMelt</span>
          </a>
          {prices && (
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

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px' }}>

        <a href="/" style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>← Back</a>

        {/* Coin Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: primaryMetal === 'gold'
              ? 'radial-gradient(circle at 35% 35%, #FCD34D, #92400E)'
              : 'radial-gradient(circle at 35% 35%, #E2E8F0, #475569)',
            boxShadow: primaryMetal === 'gold' ? '0 0 16px rgba(245,158,11,0.4)' : '0 0 16px rgba(148,163,184,0.3)',
          }} />
          <div>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{coin.country}</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 2px', lineHeight: '1.2' }}>{coin.name}</h1>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{coin.years} · {coin.denomination}</p>
          </div>
        </div>

        {/* Melt Value */}
        <div style={{ backgroundColor: '#111118', border: `1px solid ${accentColor}40`, borderRadius: '12px', padding: '18px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
          <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Melt Value</p>
          <p style={{ fontSize: '40px', fontWeight: '700', color: accentColor, margin: '0 0 6px', lineHeight: 1 }}>
            {!prices ? 'Loading...' : parseFloat(getMeltValue() || '0') > 0 ? `$${getMeltValue()}` : 'No precious metal content'}
          </p>
        </div>

        {/* Metal Content */}
        <div style={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '12px', padding: '16px', marginBottom: '8px' }}>
          <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Metal Content</p>
          {Object.entries(coin.composition).filter(([, oz]) => (oz as number) > 0).map(([metal, oz], i, arr) => (
            <div key={metal} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid #1E1E2E' : 'none' }}>
              <span style={{ fontSize: '14px', color: '#E2E8F0', textTransform: 'capitalize' }}>{metal}</span>
              <span style={{ fontSize: '14px', color: '#CBD5E1' }}>{oz as number} troy oz</span>
            </div>
          ))}
        </div>

        {/* Alloy */}
        {coin.alloy && Object.keys(coin.alloy).length > 0 && (
          <div style={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '12px', padding: '16px', marginBottom: '8px' }}>
            <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alloy Composition</p>
            {Object.entries(coin.alloy).map(([metal, pct], i, arr) => (
              <div key={metal} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid #1E1E2E' : 'none' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0', textTransform: 'capitalize' }}>{metal}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '70px', height: '3px', backgroundColor: '#1E1E2E', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: accentColor, borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#CBD5E1', width: '38px', textAlign: 'right' }}>{pct as number}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

     {/* Specs */}
        {(coin.weight > 0 || coin.diameter > 0) && (
          <div style={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '10px', color: '#94A3B8', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Specifications</p>
            {coin.weight > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: coin.diameter > 0 ? '1px solid #1E1E2E' : 'none' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0' }}>Weight</span>
                <span style={{ fontSize: '14px', color: '#CBD5E1' }}>{coin.weight} g</span>
              </div>
            )}
            {coin.diameter > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0' }}>
                <span style={{ fontSize: '14px', color: '#E2E8F0' }}>Diameter</span>
                <span style={{ fontSize: '14px', color: '#CBD5E1' }}>{coin.diameter} mm</span>
              </div>
            )}
          </div>
        )}

       {/* Report Error */}
<ReportError coinName={coin!.name} />

      </main>

      <footer style={{ borderTop: '1px solid #1E1E2E', padding: '16px 24px', marginTop: '32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>© 2026 CoinMelt · Prices updated every 12 hours</span>
          <a href="/privacy" style={{ fontSize: '11px', color: '#64748B', textDecoration: 'none' }}>Privacy Policy</a>
        </div>
      </footer>
    </div>
  )
}