import type {
  CompPlan,
  CalculationContext,
  CalculationResult,
  ComponentResult,
  MetricId,
} from '@/types/icm-dsl'
import { resolveMetrics } from './metrics'
import { evaluateTiers } from './tiers'
import { applyAccelerators } from './accelerators'
import { evaluateSPIFs } from './spifs'
import { computeMBOMultiplier } from './mbo'
import { applyDraw } from './draws'
import { computeClawbacks } from './clawbacks'
import { prorateQuota } from './proration'
import { resolveAmountSpec } from './amount'
import { evaluateCondition } from './formula'
import { auditStep } from './audit'

// Pure function: no side effects, no DB calls, deterministic.
export function runPlan(plan: CompPlan, ctx: CalculationContext): CalculationResult {
  const trail = []

  // ── Step 1: Resolve metrics from transactions ─────────────────────────────────────────
  const metrics = resolveMetrics(
    plan.metrics,
    ctx.transactions,
    ctx.periodStart,
    ctx.periodEnd,
    plan.fxSpec,
    ctx.fxRates
  )

  for (const [id, value] of Object.entries(metrics)) {
    trail.push(auditStep('metric_resolved', `Metric ${id}`, { metric: id }, value))
  }

  // ── Step 2: Resolve quotas + attainment ──────────────────────────────────────────
  const quotaValues: Record<MetricId, number> = {}
  const attainments: Record<MetricId, number> = {}

  for (const quotaSpec of plan.quotas) {
    const quotaRecord = ctx.quotas.find(q => q.metric === quotaSpec.metric)
    let rawQuota = quotaRecord?.value ?? (quotaSpec.fixedAmount ?? 0)
    rawQuota = prorateQuota(rawQuota, ctx.rep, quotaSpec, { start: ctx.periodStart, end: ctx.periodEnd })
    quotaValues[quotaSpec.metric] = rawQuota

    const metricVal = metrics[quotaSpec.metric] ?? 0
    attainments[quotaSpec.metric] = rawQuota === 0 ? 0 : metricVal / rawQuota

    trail.push(auditStep('quota_resolved', `Quota for ${quotaSpec.metric}`,
      { metric: quotaSpec.metric, rawQuota, metricValue: metricVal },
      attainments[quotaSpec.metric]
    ))
  }

  // Primary attainment (first quota metric, used for accelerator conditions)
  const primaryMetric = plan.quotas[0]?.metric ?? plan.metrics[0]?.id ?? ''
  const primaryAttainment = attainments[primaryMetric] ?? 0

  // ── Step 3–4: Evaluate components + sum ────────────────────────────────────────────
  const sortedComponents = [...plan.components].sort((a, b) => a.sequence - b.sequence)
  const componentResults: ComponentResult[] = []
  let grossEarnings = 0

  for (const comp of sortedComponents) {
    if (comp.condition) {
      const eligible = evaluateCondition(
        comp.condition, metrics, primaryAttainment, ctx.rep.tags, ctx.rep.territory
      )
      if (!eligible) {
        trail.push(auditStep(`component_${comp.id}`, `${comp.name}: skipped (condition not met)`, {}, 0))
        continue
      }
    }

    const metricValue = metrics[comp.metric] ?? 0
    const quotaValue = quotaValues[comp.metric] ?? 0
    const attainmentPct = attainments[comp.metric] ?? primaryAttainment

    let gross = 0

    switch (comp.earningsMethod.type) {
      case 'tier_table': {
        const table = plan.tierTables?.find(t => t.id === comp.earningsMethod.type === 'tier_table'
          ? (comp.earningsMethod as { tierId: string }).tierId : '')
        if (table) {
          const result = evaluateTiers(table, metricValue, quotaValue, metrics)
          gross = result.earnings
          trail.push(auditStep(`component_${comp.id}_tiers`, `${comp.name}: tier calc`,
            { metric: metricValue, quota: quotaValue, attainment: attainmentPct, tier: result.tierApplied },
            gross
          ))
        }
        break
      }
      case 'flat_rate': {
        const rate = resolveAmountSpec(comp.earningsMethod.rate, metrics)
        gross = Math.round(metricValue * rate)
        trail.push(auditStep(`component_${comp.id}`, `${comp.name}: flat rate`,
          { metric: metricValue, rate }, gross
        ))
        break
      }
      case 'flat_bonus': {
        const condMet = evaluateCondition(
          comp.earningsMethod.condition, metrics, attainmentPct, ctx.rep.tags, ctx.rep.territory
        )
        if (condMet) {
          gross = Math.round(resolveAmountSpec(comp.earningsMethod.amount, metrics))
        }
        trail.push(auditStep(`component_${comp.id}`, `${comp.name}: flat bonus`,
          { conditionMet: condMet ? 1 : 0 }, gross
        ))
        break
      }
      case 'formula': {
        const { evaluateFormula } = require('./formula')
        gross = Math.round(evaluateFormula(comp.earningsMethod.expression, metrics))
        trail.push(auditStep(`component_${comp.id}`, `${comp.name}: formula`, {}, gross))
        break
      }
    }

    // Component-level cap/floor
    if (comp.floor) {
      const floor = Math.round(resolveAmountSpec(comp.floor, metrics))
      if (gross < floor) {
        trail.push(auditStep(`component_${comp.id}_floor`, `${comp.name}: floor applied`, { before: gross, floor }, floor))
        gross = floor
      }
    }
    if (comp.cap) {
      const cap = Math.round(resolveAmountSpec(comp.cap, metrics))
      if (gross > cap) {
        trail.push(auditStep(`component_${comp.id}_cap`, `${comp.name}: cap applied`, { before: gross, cap }, cap))
        gross = cap
      }
    }

    componentResults.push({
      componentId: comp.id,
      metricValue,
      quotaValue: quotaValue || undefined,
      attainmentPercent: attainmentPct || undefined,
      grossEarnings: gross,
      netEarnings: gross,
    })
    grossEarnings += gross
  }

  trail.push(auditStep('sum_components', 'Sum of all component earnings', {}, grossEarnings))

  // ── Step 5: SPIFs ───────────────────────────────────────────────────────────────
  const spifEarnings = plan.spifs
    ? evaluateSPIFs(plan.spifs, ctx.transactions, ctx.periodStart, ctx.periodEnd, metrics)
    : []
  const spifTotal = spifEarnings.reduce((s, e) => s + e.amount, 0)
  if (spifTotal > 0) trail.push(auditStep('spifs', 'SPIF earnings', { count: spifEarnings.length }, spifTotal))

  // ── Step 6: Accelerators ───────────────────────────────────────────────────────────
  let acceleratorApplications: CalculationResult['acceleratorApplications'] = []
  if (plan.accelerators?.length) {
    const accelResult = applyAccelerators(
      plan.accelerators,
      grossEarnings,
      metrics,
      primaryAttainment,
      { tags: ctx.rep.tags, territory: ctx.rep.territory },
      plan.tierTables ?? []
    )
    grossEarnings = accelResult.earnings
    acceleratorApplications = accelResult.applications.map(a => ({
      acceleratorId: a.acceleratorId,
      conditionMet: a.conditionMet,
      effect: a.effect,
      earningsBefore: a.before,
      earningsAfter: a.after,
    }))
    trail.push(...accelResult.auditSteps)
  }

  // ── Step 7: MBO multiplier ─────────────────────────────────────────────────────────
  let mboMultiplier: number | undefined
  if (plan.mbo && ctx.mboScores?.length) {
    mboMultiplier = computeMBOMultiplier(plan.mbo, ctx.mboScores)
    grossEarnings = Math.round(grossEarnings * mboMultiplier)
    trail.push(auditStep('mbo_multiplier', 'MBO multiplier applied', { multiplier: mboMultiplier }, grossEarnings))
  }

  // ── Step 8: Global caps & floors ────────────────────────────────────────────────────
  if (plan.bounds) {
    for (const bound of plan.bounds.filter(b => b.scope === 'period')) {
      const amount = Math.round(resolveAmountSpec(bound.amount, metrics))
      if (bound.type === 'cap' && grossEarnings > amount) {
        trail.push(auditStep('global_cap', 'Global period cap applied', { before: grossEarnings, cap: amount }, amount))
        grossEarnings = amount
      }
      if (bound.type === 'floor' && grossEarnings < amount) {
        trail.push(auditStep('global_floor', 'Global period floor applied', { before: grossEarnings, floor: amount }, amount))
        grossEarnings = amount
      }
    }
  }

  // ── Step 9: Draws ─────────────────────────────────────────────────────────────────
  let drawAdjustment = 0
  if (plan.draws?.length) {
    for (const draw of plan.draws) {
      const balance = ctx.drawBalances?.find(b => b.repId === ctx.rep.id)
      const result = applyDraw(draw, grossEarnings, balance, metrics)
      drawAdjustment += result.adjustment
      trail.push(auditStep('draw', result.auditNote, { grossEarnings }, result.adjustment))
    }
  }

  // ── Step 10: Clawbacks ────────────────────────────────────────────────────────────
  let clawbackAdjustment = 0
  if (plan.clawbacks?.length && ctx.priorPeriodEarnings) {
    clawbackAdjustment = computeClawbacks(
      plan.clawbacks,
      ctx.priorPeriodEarnings,
      [], // cancelled transactions passed separately in real usage
      ctx.periodStart
    )
    if (clawbackAdjustment !== 0) {
      trail.push(auditStep('clawbacks', 'Clawback adjustments', {}, clawbackAdjustment))
    }
  }

  // ── Step 11: Final net ───────────────────────────────────────────────────────────────
  const totalEarned = grossEarnings + spifTotal + drawAdjustment + clawbackAdjustment
  trail.push(auditStep('total_earned', 'Final net earnings',
    { gross: grossEarnings, spifs: spifTotal, draw: drawAdjustment, clawback: clawbackAdjustment },
    totalEarned
  ))

  return {
    repId: ctx.rep.id,
    planId: plan.id,
    periodStart: ctx.periodStart,
    periodEnd: ctx.periodEnd,
    totalEarned,
    currency: plan.currency,
    componentResults,
    spifEarnings,
    acceleratorApplications,
    drawAdjustment: drawAdjustment || undefined,
    clawbackAdjustment: clawbackAdjustment || undefined,
    mboMultiplier,
    auditTrail: trail,
  }
}
