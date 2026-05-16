import type Anthropic from '@anthropic-ai/sdk'

// Tool 1: extract a complete (or partial) comp plan from the conversation
export const extractPlanTool: Anthropic.Tool = {
  name: 'extract_comp_plan',
  description: `Call this when you have enough information to produce a complete or partial comp plan.
  You MUST call this tool rather than returning JSON in text.
  If uncertain about any field, use reviewNotes to document assumptions.
  Set requiresAdminReview: true if material ambiguity remains.
  Percentages MUST be stored as decimals: 8% -> 0.08, 100% -> 1.0.
  Never invent quota values; if no quota mentioned, set quotas: [].
  All monetary amounts in the plan's base currency unless fxSpec defined.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      plan: {
        type: 'object',
        description: 'The CompPlan object conforming to the ICM DSL',
      },
      confidence: {
        type: 'number',
        description: '0.0-1.0. Your confidence the plan accurately captures admin intent.',
      },
      clarifying_questions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Questions to ask if confidence < 0.85 or requiresAdminReview is true. Max 3.',
      },
    },
    required: ['plan', 'confidence'],
  },
}

// Tool 2: request clarification without emitting a plan guess
export const requestClarificationTool: Anthropic.Tool = {
  name: 'request_clarification',
  description: `Call this when the description is too ambiguous to produce a reliable plan.
  Do NOT produce a guess; ask specific targeted questions.
  Maximum 3 questions per turn.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      questions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific questions needed to proceed (max 3)',
      },
      partial_understanding: {
        type: 'string',
        description: 'Brief summary of what you understood so far',
      },
    },
    required: ['questions'],
  },
}

export const ALL_TOOLS = [extractPlanTool, requestClarificationTool]
