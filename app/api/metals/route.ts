export const revalidate = 43200 // 12 hours

const DEV_PRICES = {
  gold: 4541.85,
  silver: 72.91,
  timestamp: new Date().toISOString(),
  cached: true
}

export async function GET() {
  if (process.env.NODE_ENV === 'development') {
    return Response.json(DEV_PRICES)
  }

  try {
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
      return Response.json({ error: 'API quota exceeded' }, { status: 503 })
    }

    return Response.json({
      gold: goldData.price,
      silver: silverData.price,
      timestamp: new Date().toISOString(),
      cached: false
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
