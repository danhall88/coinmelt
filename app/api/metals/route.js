let cachedPrices = null
let lastFetched = null
const CACHE_DURATION = 8 * 60 * 60 * 1000 // 8 hours = 3 calls per day

export async function GET() {
  try {
    const now = Date.now()

    if (cachedPrices && lastFetched && (now - lastFetched) < CACHE_DURATION) {
      return Response.json({ ...cachedPrices, cached: true })
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

    cachedPrices = {
      gold: goldData.price,
      silver: silverData.price,
      timestamp: new Date().toISOString()
    }
    lastFetched = now

    return Response.json({ ...cachedPrices, cached: false })

  } catch (error) {
    if (cachedPrices) {
      return Response.json({ ...cachedPrices, cached: true, stale: true })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }
}
