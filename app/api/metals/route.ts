import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ydeefthplqrdmcityonq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZWVmdGhwbHFyZG1jaXR5b25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTYwNTUsImV4cCI6MjA5MzUzMjA1NX0.V-IaNzw3W9JfFgwMB27GVzBYJzd1ZwtdCtNMx8_8pK0'
)

const DEV_PRICES = {
  gold: 4541.85,
  silver: 72.91,
  timestamp: new Date().toISOString(),
  cached: true
}

const CACHE_DURATION = 12 * 60 * 60 * 1000

export async function GET() {
  if (process.env.NODE_ENV === 'development') {
    return Response.json(DEV_PRICES)
  }

  let cachedData: any = null

  try {
    const { data, error } = await supabase
      .from('metal_prices')
      .select('*')
      .eq('id', 1)
      .single()

    if (!error && data && data.gold > 0) {
      cachedData = data
      const lastUpdated = new Date(data.updated_at).getTime()
      const now = Date.now()

      if ((now - lastUpdated) < CACHE_DURATION) {
        return Response.json({
          gold: data.gold,
          silver: data.silver,
          timestamp: data.updated_at,
          cached: true
        })
      }
    }

    const [goldRes, silverRes] = await Promise.all([
      fetch('https://www.goldapi.io/api/XAU/USD', {
        headers: { 'x-access-token': 'goldapi-8a44ca45c2bbb5b3c14107faa7e65bd2-io' }
      }),
      fetch('https://www.goldapi.io/api/XAG/USD', {
        headers: { 'x-access-token': 'goldapi-8a44ca45c2bbb5b3c14107faa7e65bd2-io' }
      })
    ])

    const goldData = await goldRes.json()
    const silverData = await silverRes.json()

    if (!goldData.price || !silverData.price) {
      if (cachedData) {
        return Response.json({
          gold: cachedData.gold,
          silver: cachedData.silver,
          timestamp: cachedData.updated_at,
          cached: true,
          stale: true
        })
      }
      return Response.json({ error: 'API quota exceeded' }, { status: 503 })
    }

    const prices = {
      gold: goldData.price,
      silver: silverData.price,
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('metal_prices')
      .update(prices)
      .eq('id', 1)

    return Response.json({
      gold: prices.gold,
      silver: prices.silver,
      timestamp: prices.updated_at,
      cached: false
    })

  } catch (error: any) {
    if (cachedData) {
      return Response.json({
        gold: cachedData.gold,
        silver: cachedData.silver,
        timestamp: cachedData.updated_at,
        cached: true,
        stale: true
      })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }
}