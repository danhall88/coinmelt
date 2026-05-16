import type { AmountSpec, MetricId } from '@/types/icm-dsl'
import { evaluateFormula } from './formula'

// Returns the rate/amount as a raw number (rate = decimal, fixed = dollar amount)
export function resolveAmountSpec(
  spec: AmountSpec,
  metrics: Record<MetricId, number> = {}
): number {
  switch (spec.type) {
    case 'percent': return spec.value
    case 'fixed': return spec.value
    case 'per_unit': return spec.value
    case 'formula': return evaluateFormula(spec.expression, metrics)
  }
}
