import type { RepRecord, QuotaSpec } from '@/types/icm-dsl'

type PeriodInfo = { start: string; end: string }

export function prorateQuota(
  quota: number,
  rep: RepRecord,
  quotaSpec: QuotaSpec,
  period: PeriodInfo
): number {
  const method = quotaSpec.proRation?.method
  if (!method || method === 'none') return quota

  const hireDate = rep.hireDate ?? period.start
  const startDate = hireDate > period.start ? hireDate : period.start

  if (startDate <= period.start) return quota // rep was active whole period

  if (method === 'full_month') return quota // no proration regardless of start

  const periodDays = daysBetween(period.start, period.end)
  const activeDays = daysBetween(startDate, period.end)

  if (periodDays === 0) return quota
  return Math.round(quota * (activeDays / periodDays))
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start).getTime()
  const b = new Date(end).getTime()
  return Math.max(0, Math.round((b - a) / 86400000) + 1)
}
