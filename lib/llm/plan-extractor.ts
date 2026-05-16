import { anthropic, MODEL, CACHE_CONTROL } from './client'
import { ALL_TOOLS } from './tools'
import { ROLE_BLOCK, DSL_REFERENCE_BLOCK, EXAMPLES_BLOCK } from './system-prompt'
import type { CompPlan } from '@/types/icm-dsl'
import type Anthropic from '@anthropic-ai/sdk'

export type ExtractionMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ExtractionResult =
  | { type: 'plan'; plan: CompPlan; confidence: number; clarifyingQuestions?: string[] }
  | { type: 'clarification'; questions: string[]; partialUnderstanding?: string }

export async function extractPlan(
  messages: ExtractionMessage[],
  existingPlan?: CompPlan
): Promise<ExtractionResult> {
  const systemContent: Anthropic.TextBlockParam[] = [
    { type: 'text', text: ROLE_BLOCK, cache_control: CACHE_CONTROL },
    { type: 'text', text: DSL_REFERENCE_BLOCK, cache_control: CACHE_CONTROL },
    { type: 'text', text: EXAMPLES_BLOCK, cache_control: CACHE_CONTROL },
  ]

  if (existingPlan) {
    systemContent.push({
      type: 'text',
      text: `Current plan DSL (update this based on the latest message):\n${JSON.stringify(existingPlan, null, 2)}`,
    })
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemContent as Anthropic.MessageParam['content'] extends string ? never : Anthropic.TextBlockParam[],
    tools: ALL_TOOLS,
    tool_choice: { type: 'any' },
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  for (const block of response.content) {
    if (block.type !== 'tool_use') continue

    if (block.name === 'extract_comp_plan') {
      const input = block.input as {
        plan: CompPlan
        confidence: number
        clarifying_questions?: string[]
      }
      return {
        type: 'plan',
        plan: input.plan,
        confidence: input.confidence,
        clarifyingQuestions: input.clarifying_questions,
      }
    }

    if (block.name === 'request_clarification') {
      const input = block.input as {
        questions: string[]
        partial_understanding?: string
      }
      return {
        type: 'clarification',
        questions: input.questions,
        partialUnderstanding: input.partial_understanding,
      }
    }
  }

  // Fallback: Claude didn't call a tool — ask for clarification
  return {
    type: 'clarification',
    questions: ['Could you describe your compensation plan in more detail?'],
  }
}

// Streaming version for real-time UI feedback
export async function* extractPlanStream(
  messages: ExtractionMessage[],
  existingPlan?: CompPlan
): AsyncGenerator<
  | { type: 'text'; content: string }
  | { type: 'result'; result: ExtractionResult }
  | { type: 'error'; message: string }
> {
  try {
    const systemContent = [
      { type: 'text' as const, text: ROLE_BLOCK, cache_control: CACHE_CONTROL },
      { type: 'text' as const, text: DSL_REFERENCE_BLOCK, cache_control: CACHE_CONTROL },
      { type: 'text' as const, text: EXAMPLES_BLOCK, cache_control: CACHE_CONTROL },
    ]

    if (existingPlan) {
      systemContent.push({
        type: 'text' as const,
        text: `Current plan DSL:\n${JSON.stringify(existingPlan, null, 2)}`,
        cache_control: CACHE_CONTROL,
      })
    }

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: systemContent,
      tools: ALL_TOOLS,
      tool_choice: { type: 'any' },
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    let textBuffer = ''

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        textBuffer += event.delta.text
        yield { type: 'text', content: event.delta.text }
      }
    }

    const finalMessage = await stream.finalMessage()

    for (const block of finalMessage.content) {
      if (block.type !== 'tool_use') continue

      if (block.name === 'extract_comp_plan') {
        const input = block.input as {
          plan: CompPlan
          confidence: number
          clarifying_questions?: string[]
        }
        yield {
          type: 'result',
          result: {
            type: 'plan',
            plan: input.plan,
            confidence: input.confidence,
            clarifyingQuestions: input.clarifying_questions,
          },
        }
        return
      }

      if (block.name === 'request_clarification') {
        const input = block.input as {
          questions: string[]
          partial_understanding?: string
        }
        yield {
          type: 'result',
          result: {
            type: 'clarification',
            questions: input.questions,
            partialUnderstanding: input.partial_understanding,
          },
        }
        return
      }
    }
  } catch (err) {
    yield { type: 'error', message: err instanceof Error ? err.message : 'Unknown error' }
  }
}
