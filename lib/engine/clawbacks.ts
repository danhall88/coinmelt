import type { ClawbackSpec, PriorEarnings, TransactionRecord } from '@/types/icm-dsl'

export function computeClawbacks(
  clawbacks: ClawbackSpec[],
  priorEarnings: PriorEarnings[],
  cancelledTransactions: TransactionRecord[], // transactions with a 'cancelled' flag or that disappeared
  periodStart: string
): number {
  let totalClawback = 0

  for (const spec of clawbacks) {
    for (const tx of cancelledTransactions) {
      const priorEarning = priorEarnings.find(p => p.dealId === tx.id)
      if (!priorEarning) continue

      if (!clawbackTriggerMet(spec, tx, periodStart)) continue

      totalClawback += Math.round(priorEarning.earnedAmount * spec.fraction)
    }
  }

  return -totalClawback
}

function clawbackTriggerMet(
  spec: ClawbackSpec,
  tx: TransactionRecord,
  periodStart: string
): boolean {
  const today = periodStart
  switch (spec.trigger.type) {
    case 'deal_cancelled':
    case 'payment_default':
    case 'rep_churned_customer': {
      const closeDate = new Date(tx.closeDate).getTime()
      const period = new Date(today).getTime()
      const daysDiff = Math.round((period - closeDate) / 86400000)
      return daysDiff <= spec.trigger.withinDays
    }
    case 'condition':
      return false // evaluated separately with full context
  }
}
