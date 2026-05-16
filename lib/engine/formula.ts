import type { FormulaExpression, Condition, MetricId } from '@/types/icm-dsl'

export function evaluateFormula(
  expr: FormulaExpression,
  metrics: Record<MetricId, number>
): number {
  const ev = (e: FormulaExpression): number => evaluateFormula(e, metrics)

  switch (expr.op) {
    case 'literal': return expr.value
    case 'ref': return metrics[expr.metric] ?? 0
    case 'add': return ev(expr.left) + ev(expr.right)
    case 'sub': return ev(expr.left) - ev(expr.right)
    case 'mul': return ev(expr.left) * ev(expr.right)
    case 'div': {
      const divisor = ev(expr.right)
      return divisor === 0 ? 0 : ev(expr.left) / divisor
    }
    case 'min': return Math.min(...expr.operands.map(ev))
    case 'max': return Math.max(...expr.operands.map(ev))
    case 'if': return evaluateCondition(expr.condition, metrics) ? ev(expr.then) : ev(expr.else)
    case 'clamp': {
      let v = ev(expr.value)
      if (expr.min) v = Math.max(v, ev(expr.min))
      if (expr.max) v = Math.min(v, ev(expr.max))
      return v
    }
  }
}

export function evaluateCondition(
  condition: Condition,
  metrics: Record<MetricId, number>,
  attainment?: number,
  repTags?: string[],
  repTerritory?: string,
  currentDate?: string
): boolean {
  switch (condition.type) {
    case 'metric_gte': return (metrics[condition.metric] ?? 0) >= condition.threshold
    case 'metric_lte': return (metrics[condition.metric] ?? 0) <= condition.threshold
    case 'metric_between': {
      const v = metrics[condition.metric] ?? 0
      return v >= condition.min && v <= condition.max
    }
    case 'attainment_gte': return (attainment ?? 0) >= condition.threshold
    case 'attainment_between': {
      const a = attainment ?? 0
      return a >= condition.min && a <= condition.max
    }
    case 'rep_has_tag': return (repTags ?? []).includes(condition.tag)
    case 'rep_in_territory': return repTerritory === condition.territory
    case 'date_in_range': {
      const d = currentDate ?? ''
      return d >= condition.start && d <= condition.end
    }
    case 'and': return condition.conditions.every(c =>
      evaluateCondition(c, metrics, attainment, repTags, repTerritory, currentDate)
    )
    case 'or': return condition.conditions.some(c =>
      evaluateCondition(c, metrics, attainment, repTags, repTerritory, currentDate)
    )
    case 'not': return !evaluateCondition(
      condition.condition, metrics, attainment, repTags, repTerritory, currentDate
    )
  }
}
