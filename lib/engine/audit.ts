import type { AuditStep } from '@/types/icm-dsl'

export function auditStep(
  step: string,
  description: string,
  inputs: Record<string, number | string>,
  output: number
): AuditStep {
  return { step, description, inputs, output }
}
