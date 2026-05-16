import type { AcceleratorSpec, TierTable, MetricId } from '@/types/icm-dsl'
import { evaluateCondition } from './formula'
import { resolveAmountSpec } from './amount'
import { evaluateTiers } from './tiers'
import type { AuditStep } from '@/types/icm-dsl'
import { auditStep } from './audit'

export type AcceleratorResult = {
  earnings: number
  applications: Array<{ acceleratorId: string; conditionMet: boolean; effect: string; before: number; after: number }>
  auditSteps: AuditStep[]
}

export function applyAccelerators(
  accelerators: AcceleratorSpec[],
  grossEarnings: number,
  metrics: Record<MetricId, number>,
  attainment: number,
  rep: { tags?: string[]; territory?: string },
  tierTables: TierTable[]
): AcceleratorResult {
  const sorted = [...accelerators].sort((a, b) =>
    a.priority !== b.priority ? a.priority - b.priority : a.id.localeCompare(b.id)
  )

  let earnings = grossEarnings
  const applications: AcceleratorResult['applications'] = []
  const auditSteps: AuditStep[] = []
  let nonStackableApplied = false

  for (const acc of sorted) {
    const met = evaluateCondition(
      acc.condition, metrics, attainment, rep.tags, rep.territory
    )

    if (!met) {
      applications.push({ acceleratorId: acc.id, conditionMet: false, effect: 'skipped', before: earnings, after: earnings })
      continue
    }

    if (!acc.stackable && nonStackableApplied) {
      applications.push({ acceleratorId: acc.id, conditionMet: true, effect: 'blocked (non-stackable)', before: earnings, after: earnings })
      continue
    }

    const before = earnings

    switch (acc.effect.type) {
      case 'multiply_earnings':
        earnings = Math.round(earnings * acc.effect.factor)
        break
      case 'multiply_rate':
        // Re-apply at scaled rate — for simplicity, multiply earnings by factor
        earnings = Math.round(earnings * acc.effect.factor)
        break
      case 'add_flat_bonus':
        earnings += Math.round(resolveAmountSpec(acc.effect.amount, metrics))
        break
      case 'override_tier_table': {
        const table = tierTables.find(t => t.id === acc.effect.type === 'override_tier_table' ? (acc.effect as { tierId: string }).tierId : '')
        if (table) {
          // Re-run tier calculation with override table
          const quota = metrics[`quota_${Object.keys(metrics)[0]}`] ?? 0
          const result = evaluateTiers(table, Object.values(metrics)[0] ?? 0, quota, metrics)
          earnings = result.earnings
        }
        break
      }
    }

    if (!acc.stackable) nonStackableApplied = true
    applications.push({ acceleratorId: acc.id, conditionMet: true, effect: acc.effect.type, before, after: earnings })
    auditSteps.push(auditStep(
      `accelerator_${acc.id}`,
      `Applied accelerator: ${acc.name}`,
      { effect: acc.effect.type, before },
      earnings
    ))
  }

  return { earnings, applications, auditSteps }
}
