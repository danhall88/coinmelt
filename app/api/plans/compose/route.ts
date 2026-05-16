import { extractPlanStream } from '@/lib/llm/plan-extractor'
import type { ExtractionMessage } from '@/lib/llm/plan-extractor'
import type { CompPlan } from '@/types/icm-dsl'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const { messages, existingPlan }: { messages: ExtractionMessage[]; existingPlan?: CompPlan } =
    await request.json()

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of extractPlanStream(messages, existingPlan)) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}
