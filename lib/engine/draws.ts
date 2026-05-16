import type { DrawSpec, AmountSpec, MetricId, DrawBalance } from '@/types/icm-dsl'
import { resolveAmountSpec } from './amount'

export type DrawResult = {
  adjustment: number
  newBalance: number
  auditNote: string
}

export function applyDraw(
  draw: DrawSpec,
  grossEarnings: number,
  drawBalance: DrawBalance | undefined,
  metrics: Record<MetricId, number>
): DrawResult {
  const drawAmount = Math.round(resolveAmountSpec(draw.amount, metrics))

  if (draw.type === 'non_recoverable') {
    if (grossEarnings >= drawAmount) {
      return { adjustment: 0, newBalance: 0, auditNote: 'Non-recoverable draw: earnings exceed draw' }
    }
    const adjustment = drawAmount - grossEarnings
    return { adjustment, newBalance: 0, auditNote: `Non-recoverable draw top-up: +${adjustment}` }
  }

  // Recoverable draw
  const outstanding = drawBalance?.outstandingAmount ?? 0

  if (grossEarnings < drawAmount) {
    // Earnings below draw: pay draw, increase balance
    const shortfall = drawAmount - grossEarnings
    return {
      adjustment: shortfall,
      newBalance: outstanding + shortfall,
      auditNote: `Recoverable draw: paid ${drawAmount}, earnings ${grossEarnings}, balance increased by ${shortfall}`,
    }
  }

  // Earnings above draw: recoup from balance
  const minThreshold = draw.recoupment?.minimumEarnedThreshold
    ? Math.round(resolveAmountSpec(draw.recoupment.minimumEarnedThreshold, metrics))
    : 0

  if (grossEarnings <= minThreshold) {
    return { adjustment: 0, newBalance: outstanding, auditNote: 'Below recoupment threshold' }
  }

  const recoupment = Math.min(outstanding, grossEarnings - drawAmount)
  return {
    adjustment: -recoupment,
    newBalance: Math.max(0, outstanding - recoupment),
    auditNote: `Recouped ${recoupment} from draw balance`,
  }
}
