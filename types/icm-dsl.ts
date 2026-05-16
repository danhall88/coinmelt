// ICM DSL — Intermediate Representation
// The structured format Claude extracts from natural language comp plan descriptions.
// This is the core IP: expressive enough for all edge cases, parseable by the deterministic engine.

export type ISO8601Date = string
export type CurrencyCode = string
export type RepId = string
export type PlanId = string
export type MetricId = string

// ─── Amount Specifications ───────────────────────────────────────────────────

export type AmountSpec =
  | { type: 'fixed'; value: number; currency: CurrencyCode }
  | { type: 'percent'; value: number } // 0.08 = 8%
  | { type: 'per_unit'; value: number; currency: CurrencyCode }
  | { type: 'formula'; expression: FormulaExpression }

// ─── Formula AST (no arbitrary code — safe for serialization) ────────────────

export type FormulaExpression =
  | { op: 'literal'; value: number }
  | { op: 'ref'; metric: MetricId }
  | { op: 'add' | 'sub' | 'mul' | 'div'; left: FormulaExpression; right: FormulaExpression }
  | { op: 'min' | 'max'; operands: FormulaExpression[] }
  | { op: 'if'; condition: Condition; then: FormulaExpression; else: FormulaExpression }
  | { op: 'clamp'; value: FormulaExpression; min?: FormulaExpression; max?: FormulaExpression }

// ─── Conditions ──────────────────────────────────────────────────────────────

export type Condition =
  | { type: 'metric_gte'; metric: MetricId; threshold: number }
  | { type: 'metric_lte'; metric: MetricId; threshold: number }
  | { type: 'metric_between'; metric: MetricId; min: number; max: number }
  | { type: 'attainment_gte'; threshold: number } // 0.8 = 80%
  | { type: 'attainment_between'; min: number; max: number }
  | { type: 'rep_has_tag'; tag: string }
  | { type: 'rep_in_territory'; territory: string }
  | { type: 'date_in_range'; start: ISO8601Date; end: ISO8601Date }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition }

// ─── Quota ───────────────────────────────────────────────────────────────────

export type QuotaSpec = {
  metric: MetricId
  source: 'imported' | 'fixed'
  fixedAmount?: number
  proRation?: {
    method: 'calendar_days' | 'business_days' | 'full_month' | 'none'
    startDateField?: string
  }
}

// ─── Tier Tables ─────────────────────────────────────────────────────────────

export type TierTable = {
  id: string
  name: string
  basis: 'attainment_percent' | 'revenue' | 'units' | MetricId
  // marginal = waterfall (each tier applied to its band only)
  // retroactive = step-up (tier rate applies to all earnings once crossed)
  style: 'marginal' | 'retroactive'
  tiers: TierEntry[]
}

export type TierEntry = {
  from: number // lower bound inclusive; upper = next tier's from or Infinity
  to?: number
  rate: AmountSpec
  label?: string
}

// ─── Accelerators & Decelerators ─────────────────────────────────────────────

export type AcceleratorSpec = {
  id: string
  name: string
  condition: Condition
  effect:
    | { type: 'multiply_earnings'; factor: number }
    | { type: 'multiply_rate'; factor: number }
    | { type: 'add_flat_bonus'; amount: AmountSpec }
    | { type: 'override_tier_table'; tierId: string }
  priority: number
  stackable: boolean
}

// ─── Caps & Floors ────────────────────────────────────────────────────────────

export type EarningsBoundSpec = {
  type: 'cap' | 'floor'
  scope: 'period' | 'year_to_date' | 'per_deal'
  amount: AmountSpec
  condition?: Condition
}

// ─── SPIFs ────────────────────────────────────────────────────────────────────

export type SPIFSpec = {
  id: string
  name: string
  trigger:
    | { type: 'product_sold'; productTag: string }
    | { type: 'deal_above_threshold'; metric: MetricId; threshold: number }
    | { type: 'new_logo' }
    | { type: 'condition'; condition: Condition }
  payout: AmountSpec
  repeatable: boolean
  maxOccurrences?: number
  activeFrom?: ISO8601Date
  activeTo?: ISO8601Date
}

// ─── Draws ────────────────────────────────────────────────────────────────────

export type DrawSpec = {
  type: 'recoverable' | 'non_recoverable'
  amount: AmountSpec
  recoupment?: {
    method: 'next_period' | 'spread_periods'
    maxPeriods?: number
    minimumEarnedThreshold?: AmountSpec
  }
}

// ─── Clawbacks ────────────────────────────────────────────────────────────────

export type ClawbackSpec = {
  id: string
  name: string
  trigger:
    | { type: 'deal_cancelled'; withinDays: number }
    | { type: 'payment_default'; withinDays: number }
    | { type: 'rep_churned_customer'; withinDays: number }
    | { type: 'condition'; condition: Condition }
  fraction: number // 1.0 = 100%, 0.5 = 50%
  lookbackPeriods: number
}

// ─── MBO / Objective Scoring ─────────────────────────────────────────────────

export type MBOSpec = {
  id: string
  name: string
  objectives: MBOObjective[]
  aggregation: 'weighted_average' | 'all_or_nothing' | 'proportional'
}

export type MBOObjective = {
  id: string
  name: string
  weight: number // 0-1, all weights must sum to 1.0
  scoringMethod: 'manual' | 'auto_metric'
  autoMetric?: MetricId
  fullScoreThreshold?: number
}

// ─── Territory & Team Splits ──────────────────────────────────────────────────

export type SplitSpec = {
  type: 'territory' | 'overlay' | 'team'
  method:
    | { type: 'equal' }
    | { type: 'by_field'; field: string }
    | { type: 'primary_gets_all' }
    | { type: 'fixed_weights'; weights: Record<RepId, number> }
}

// ─── FX / Multi-Currency ─────────────────────────────────────────────────────

export type FXSpec = {
  baseCurrency: CurrencyCode
  rateSource: 'fixed_table' | 'imported_rates' | 'spot_at_close_date'
  fixedRates?: Record<CurrencyCode, number>
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export type MetricDefinition = {
  id: MetricId
  name: string
  aggregation:
    | { type: 'sum'; field: string; filters?: FieldFilter[] }
    | { type: 'count'; filters?: FieldFilter[] }
    | { type: 'average'; field: string; filters?: FieldFilter[] }
    | { type: 'max' | 'min'; field: string; filters?: FieldFilter[] }
    | { type: 'formula'; expression: FormulaExpression }
  unit: 'currency' | 'units' | 'percent' | 'score' | 'custom'
  currency?: CurrencyCode
}

export type FieldFilter = {
  field: string
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains'
  value: string | number | boolean | (string | number)[]
}

// ─── Eligibility & Role Changes ──────────────────────────────────────────────

export type EligibilityRule = {
  condition: Condition
  midPeriodChange: 'prorate' | 'full_period' | 'no_credit'
}

export type RoleChangeSpec = {
  method: 'prorate_by_time' | 'prorate_by_quota' | 'use_final_role' | 'use_initial_role'
  cliffDays?: number
}

// ─── Earning Component ───────────────────────────────────────────────────────

export type CompComponent = {
  id: string
  name: string
  sequence: number
  metric: MetricId
  earningsMethod:
    | { type: 'tier_table'; tierId: string }
    | { type: 'flat_rate'; rate: AmountSpec }
    | { type: 'flat_bonus'; amount: AmountSpec; condition: Condition }
    | { type: 'formula'; expression: FormulaExpression }
    | { type: 'mbo'; mboId: string }
  cap?: AmountSpec
  floor?: AmountSpec
  condition?: Condition
}

// ─── Top-Level Plan ──────────────────────────────────────────────────────────

export type CompPlan = {
  id: PlanId
  version: number
  name: string
  description: string
  effectiveFrom: ISO8601Date
  effectiveTo?: ISO8601Date
  period: 'monthly' | 'quarterly' | 'annually' | 'custom'
  customPeriodDays?: number
  currency: CurrencyCode
  fxSpec?: FXSpec

  eligibility?: EligibilityRule
  roleChangeHandling?: RoleChangeSpec

  metrics: MetricDefinition[]
  quotas: QuotaSpec[]
  tierTables?: TierTable[]

  components: CompComponent[]

  accelerators?: AcceleratorSpec[]
  bounds?: EarningsBoundSpec[]
  draws?: DrawSpec[]
  clawbacks?: ClawbackSpec[]
  mbo?: MBOSpec
  spifs?: SPIFSpec[]
  splits?: SplitSpec

  // LLM metadata
  createdFromPrompt?: string
  llmConfidence?: number
  requiresAdminReview?: boolean
  reviewNotes?: string[]
}

// ─── Calculation Context ─────────────────────────────────────────────────────

export type CalculationContext = {
  planId: PlanId
  periodStart: ISO8601Date
  periodEnd: ISO8601Date
  rep: RepRecord
  transactions: TransactionRecord[]
  quotas: QuotaRecord[]
  mboScores?: MBOScoreRecord[]
  fxRates?: Record<CurrencyCode, number>
  drawBalances?: DrawBalance[]
  priorPeriodEarnings?: PriorEarnings[]
}

export type RepRecord = {
  id: RepId
  name: string
  email: string
  role: string
  territory?: string
  tags?: string[]
  hireDate?: ISO8601Date
  roleChangeDate?: ISO8601Date
  previousRole?: string
  customFields?: Record<string, string | number | boolean>
}

export type TransactionRecord = {
  id: string
  repId: RepId
  closeDate: ISO8601Date
  amount: number
  currency: CurrencyCode
  productTag?: string
  isNewLogo?: boolean
  territory?: string
  splitPercent?: number
  customFields?: Record<string, string | number | boolean>
}

export type QuotaRecord = {
  repId: RepId
  metric: MetricId
  value: number
  currency?: CurrencyCode
}

export type MBOScoreRecord = {
  repId: RepId
  objectiveId: string
  score: number // 0-1
}

export type DrawBalance = {
  repId: RepId
  outstandingAmount: number
  currency: CurrencyCode
}

export type PriorEarnings = {
  repId: RepId
  periodStart: ISO8601Date
  dealId: string
  earnedAmount: number
}

// ─── Engine Output ───────────────────────────────────────────────────────────

export type CalculationResult = {
  repId: RepId
  planId: PlanId
  periodStart: ISO8601Date
  periodEnd: ISO8601Date
  totalEarned: number // in cents
  currency: CurrencyCode
  componentResults: ComponentResult[]
  spifEarnings: SpifEarning[]
  acceleratorApplications: AcceleratorApplication[]
  drawAdjustment?: number
  clawbackAdjustment?: number
  mboMultiplier?: number
  auditTrail: AuditStep[]
}

export type ComponentResult = {
  componentId: string
  metricValue: number
  quotaValue?: number
  attainmentPercent?: number
  tierApplied?: string
  grossEarnings: number
  capApplied?: number
  floorApplied?: number
  netEarnings: number
}

export type SpifEarning = {
  spifId: string
  dealId: string
  amount: number
}

export type AcceleratorApplication = {
  acceleratorId: string
  conditionMet: boolean
  effect: string
  earningsBefore: number
  earningsAfter: number
}

export type AuditStep = {
  step: string
  description: string
  inputs: Record<string, number | string>
  output: number
}
