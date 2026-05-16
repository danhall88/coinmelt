import type {
  MetricDefinition,
  TransactionRecord,
  FieldFilter,
  FormulaExpression,
  MetricId,
  FXSpec,
  CurrencyCode,
} from '@/types/icm-dsl'
import { convertToBase } from './fx'
import { evaluateFormula } from './formula'

export function resolveMetrics(
  definitions: MetricDefinition[],
  transactions: TransactionRecord[],
  periodStart: string,
  periodEnd: string,
  fxSpec: FXSpec | undefined,
  fxRates: Record<CurrencyCode, number> | undefined
): Record<MetricId, number> {
  const values: Record<MetricId, number> = {}

  for (const def of definitions) {
    const agg = def.aggregation
    if (agg.type === 'formula') {
      // Computed after all base metrics are resolved
      continue
    }

    const filtered = transactions.filter(tx => {
      if (tx.closeDate < periodStart || tx.closeDate > periodEnd) return false
      if (agg.type !== 'formula' && 'filters' in agg && agg.filters) {
        return agg.filters.every(f => matchFilter(tx, f))
      }
      return true
    })

    switch (agg.type) {
      case 'sum': {
        const sum = filtered.reduce((acc, tx) => {
          const amount = tx.splitPercent != null ? tx.amount * tx.splitPercent : tx.amount
          const converted = convertToBase(amount, tx.currency, fxSpec, fxRates)
          return acc + converted
        }, 0)
        values[def.id] = Math.round(sum)
        break
      }
      case 'count':
        values[def.id] = filtered.length
        break
      case 'average': {
        if (filtered.length === 0) { values[def.id] = 0; break }
        const total = filtered.reduce((acc, tx) => acc + getField(tx, agg.field), 0)
        values[def.id] = Math.round(total / filtered.length)
        break
      }
      case 'max': {
        values[def.id] = filtered.length === 0 ? 0 :
          Math.max(...filtered.map(tx => getField(tx, agg.field)))
        break
      }
      case 'min': {
        values[def.id] = filtered.length === 0 ? 0 :
          Math.min(...filtered.map(tx => getField(tx, agg.field)))
        break
      }
    }
  }

  // Second pass: formula metrics (can reference base metrics)
  for (const def of definitions) {
    if (def.aggregation.type === 'formula') {
      values[def.id] = Math.round(evaluateFormula(def.aggregation.expression, values))
    }
  }

  return values
}

function matchFilter(tx: TransactionRecord, filter: FieldFilter): boolean {
  const raw = getField(tx, filter.field)
  const v = filter.value
  switch (filter.op) {
    case 'eq': return raw === v
    case 'neq': return raw !== v
    case 'gt': return typeof raw === 'number' && typeof v === 'number' && raw > v
    case 'gte': return typeof raw === 'number' && typeof v === 'number' && raw >= v
    case 'lt': return typeof raw === 'number' && typeof v === 'number' && raw < v
    case 'lte': return typeof raw === 'number' && typeof v === 'number' && raw <= v
    case 'in': return Array.isArray(v) && v.includes(raw as string | number)
    case 'not_in': return Array.isArray(v) && !v.includes(raw as string | number)
    case 'contains': return typeof raw === 'string' && typeof v === 'string' && raw.includes(v)
  }
}

function getField(tx: TransactionRecord, field: string): string | number | boolean {
  const direct = (tx as Record<string, unknown>)[field]
  if (direct !== undefined) return direct as string | number | boolean
  return (tx.customFields?.[field] ?? 0) as string | number | boolean
}
