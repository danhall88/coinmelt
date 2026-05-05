export async function GET() {
  try {
    const response = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=765cfa8af896bf17a7e46034f5f272c8&base=USD&currencies=XAU,XAG`
    )

    const data = await response.json()

    return Response.json({
      gold: data.rates.USDXAU,
      silver: data.rates.USDXAG,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}