# ICM App — AI-Driven Incentive Compensation Management

## What This Is

An LLM-first SaaS that replaces legacy ICM tools (Xactly, CaptivateIQ, Spiff).
Admins describe comp plans in plain English → Claude extracts a structured DSL →
a deterministic TypeScript engine calculates payments → reports are generated.

## Stack

- **Framework**: Next.js 16 App Router + TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **LLM**: Claude via Anthropic SDK (prompt caching + tool use)
- **Billing**: Stripe (per-seat SaaS)
- **Hosting**: Vercel

## Key Architecture

### The ICM DSL (`types/icm-dsl.ts`)
The intermediate representation that Claude outputs and the engine consumes.
This is the core IP. Every other file depends on it.

### Calculation Engine (`lib/engine/`)
Pure function: `runPlan(CompPlan, CalculationContext) → CalculationResult`.
No side effects, no DB calls, fully unit-testable. Integer-cent arithmetic.

### LLM Layer (`lib/llm/`)
Claude is given two tools: `extract_comp_plan` and `request_clarification`.
Never returns raw JSON in text — always uses tool calls for structured output.
System prompt uses Anthropic prompt caching on static blocks.

## Development

```bash
npm install
npm run dev
npm test
```

## Environment

Copy `.env.example` to `.env.local` and fill in all values before running.

## Multi-Tenancy

All tables have `org_id`. Supabase RLS policies enforce tenant isolation.
All queries automatically scoped to the authenticated user's org.

## Engine Execution Order

1. Resolve metrics from transactions (FX, pro-ration, splits)
2. Resolve quotas + compute attainment %
3. Evaluate components in sequence
4. Sum component earnings
5. Apply SPIFs
6. Apply accelerators (priority order)
7. Apply MBO multiplier
8. Apply global caps + floors
9. Apply draws
10. Check clawbacks
11. Compute final net
12. Build audit trail
