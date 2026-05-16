import type { SPIFSpec, TransactionRecord, MetricId, SpifEarning } from '@/types/icm-dsl'
import { resolveAmountSpec } from './amount'
import { evaluateCondition } from './formula'

export function evaluateSPIFs(
  spifs: SPIFSpec[],
  transactions: TransactionRecord[],
  periodStart: string,
  periodEnd: string,
  metrics: Record<MetricId, number>
): SpifEarning[] {
  const earnings: SpifEarning[] = []

  for (const spif of spifs) {
    let count = 0
    const max = spif.maxOccurrences ?? Infinity

    const activeTxs = transactions.filter(tx => {
      if (tx.closeDate < periodStart || tx.closeDate > periodEnd) return false
      if (spif.activeFrom && tx.closeDate < spif.activeFrom) return false
      if (spif.activeTo && tx.closeDate > spif.activeTo) return false
      return true
    })

    for (const tx of activeTxs) {
      if (!spif.repeatable && count >= 1) break
      if (count >= max) break

      const triggered = matchSpifTrigger(spif, tx, metrics)
      if (!triggered) continue

      const amount = Math.round(resolveAmountSpec(spif.payout, metrics))
      earnings.push({ spifId: spif.id, dealId: tx.id, amount })
      count++
    }
  }

  return earnings
}

function matchSpifTrigger(
  spif: SPIFSpec,
  tx: TransactionRecord,
  metrics: Record<MetricId, number>
): boolean {
  switch (spif.trigger.type) {
    case 'product_sold':
      return tx.productTag === spif.trigger.productTag
    case 'deal_above_threshold':
      return tx.amount >= spif.trigger.threshold
    case 'new_logo':
      return tx.isNewLogo === true
    case 'condition':
      return evaluateCondition(spif.trigger.condition, metrics)
  }
}
