import type { CompPlan } from './icm-dsl'

export type ApiError = {
  error: string
  details?: string
}

// POST /api/plans/compose
export type ComposePlanRequest = {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  existingPlan?: CompPlan
}

// Streamed as JSON lines
export type ComposePlanStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'plan'; plan: CompPlan; confidence: number; clarifyingQuestions?: string[] }
  | { type: 'clarification'; questions: string[]; partialUnderstanding?: string }
  | { type: 'error'; message: string }
  | { type: 'done' }

// POST /api/runs
export type CreateRunRequest = {
  planId: string
  periodStart: string
  periodEnd: string
}

export type CreateRunResponse = {
  runId: string
  status: 'pending'
}

// GET /api/runs/:id
export type RunStatusResponse = {
  id: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  summary?: {
    totalPayout: number
    currency: string
    repCount: number
    avgAttainment: number
  }
  errorLog?: unknown
  completedAt?: string
}
