'use client'

import { useState } from 'react'
import { ChatPanel } from '@/components/plan-builder/ChatPanel'
import { DslPreview } from '@/components/plan-builder/DslPreview'
import type { CompPlan } from '@/types/icm-dsl'

export default function NewPlanPage() {
  const [plan, setPlan] = useState<CompPlan | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([])

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-gray-200">
        <ChatPanel
          onPlanExtracted={(p, c, q) => {
            setPlan(p)
            setConfidence(c)
            setClarifyingQuestions(q ?? [])
          }}
          currentPlan={plan ?? undefined}
        />
      </div>
      <div className="w-96 bg-white overflow-auto">
        <DslPreview
          plan={plan}
          confidence={confidence}
          clarifyingQuestions={clarifyingQuestions}
        />
      </div>
    </div>
  )
}
