import type { CurrencyCode, FXSpec } from '@/types/icm-dsl'

export function convertToBase(
  amount: number,
  fromCurrency: CurrencyCode,
  fxSpec: FXSpec | undefined,
  runtimeRates: Record<CurrencyCode, number> | undefined
): number {
  if (!fxSpec || fromCurrency === fxSpec.baseCurrency) return amount

  const rates = runtimeRates ?? fxSpec.fixedRates ?? {}
  const rate = rates[fromCurrency]
  if (!rate) {
    console.warn(`No FX rate for ${fromCurrency} -> ${fxSpec.baseCurrency}, using 1.0`)
    return amount
  }
  return Math.round(amount * rate)
}
