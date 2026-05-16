import type { TierTable, AmountSpec, MetricId } from '@/types/icm-dsl'
import { resolveAmountSpec } from './amount'

export type TierResult = {
  earnings: number
  tierApplied: string
  auditRows: Array<{ label: string; from: number; to: number; valueInBand: number; rate: number; earnings: number }>
}

export function evaluateTiers(
  table: TierTable,
  metricValue: number,
  quotaValue: number,
  metrics: Record<MetricId, number>
): TierResult {
  const sorted = [...table.tiers].sort((a, b) => a.from - b.from)

  // Convert 'from'/'to' based on tier basis
  const toAbsolute = (pct: number): number => {
    if (table.basis === 'attainment_percent') return pct * quotaValue
    return pct
  }

  if (table.style === 'marginal') {
    return evaluateMarginal(sorted, metricValue, toAbsolute, metrics)
  }
  return evaluateRetroactive(sorted, metricValue, toAbsolute, metrics)
}

function evaluateMarginal(
  tiers: TierTable['tiers'],
  value: number,
  toAbsolute: (n: number) => number,
  metrics: Record<MetricId, number>
): TierResult {
  let earnings = 0
  let tierApplied = ''
  const auditRows: TierResult['auditRows'] = []

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i]
    const floor = toAbsolute(tier.from)
    const ceiling = tiers[i + 1] ? toAbsolute(tiers[i + 1].from) : Infinity

    if (value <= floor) break

    const valueInBand = Math.min(value, ceiling) - floor
    if (valueInBand <= 0) continue

    const rate = resolveAmountSpec(tier.rate, metrics)
    const bandEarnings = Math.round(valueInBand * rate)
    earnings += bandEarnings
    tierApplied = tier.label ?? `Tier ${i + 1}`
    auditRows.push({ label: tier.label ?? `Tier ${i + 1}`, from: floor, to: ceiling, valueInBand, rate, earnings: bandEarnings })
  }

  return { earnings, tierApplied, auditRows }
}

function evaluateRetroactive(
  tiers: TierTable['tiers'],
  value: number,
  toAbsolute: (n: number) => number,
  metrics: Record<MetricId, number>
): TierResult {
  const descending = [...tiers].sort((a, b) => b.from - a.from)

  for (const tier of descending) {
    const floor = toAbsolute(tier.from)
    if (value >= floor) {
      const rate = resolveAmountSpec(tier.rate, metrics)
      const earnings = Math.round(value * rate)
      return {
        earnings,
        tierApplied: tier.label ?? 'Retroactive',
        auditRows: [{ label: tier.label ?? 'Retroactive', from: floor, to: Infinity, valueInBand: value, rate, earnings }],
      }
    }
  }

  return { earnings: 0, tierApplied: 'Below floor', auditRows: [] }
}
