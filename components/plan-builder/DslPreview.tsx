'use client'

import { useState } from 'react'
import type { CompPlan } from '@/types/icm-dsl'
import { AlertCircle, CheckCircle, Save, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  plan: CompPlan | null
  confidence: number | null
  clarifyingQuestions: string[]
}

export function DslPreview({ plan, confidence, clarifyingQuestions }: Props) {
  const [saving, setSaving] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (!plan) return
    setSaving(true)
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          dsl: plan,
          effectiveFrom: plan.effectiveFrom,
          effectiveTo: plan.effectiveTo,
          period: plan.period,
          llmConfidence: confidence,
          requiresReview: plan.requiresAdminReview,
          reviewNotes: plan.reviewNotes,
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        router.push(`/plans/${saved.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <p className="text-sm font-medium text-gray-500">Plan preview</p>
          <p className="text-xs text-gray-400 mt-1">Describe your comp plan in the chat to see it structured here</p>
        </div>
      </div>
    )
  }

  const confidenceColor = confidence && confidence >= 0.85 ? 'text-green-600' :
    confidence && confidence >= 0.75 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{plan.name}</h3>
          {confidence !== null && (
            <span className={`text-xs font-medium ${confidenceColor}`}>
              {Math.round(confidence * 100)}% confidence
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save size={12} />
          {saving ? 'Saving…' : 'Save plan'}
        </button>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {/* Review banner */}
        {plan.requiresAdminReview && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">Review required</span>
            </div>
            {plan.reviewNotes?.map((note, i) => (
              <p key={i} className="text-xs text-amber-700">• {note}</p>
            ))}
          </div>
        )}

        {/* Clarifying questions */}
        {clarifyingQuestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">Open questions</p>
            {clarifyingQuestions.map((q, i) => (
              <p key={i} className="text-xs text-blue-700">• {q}</p>
            ))}
          </div>
        )}

        {/* Plan summary */}
        <Section title="Plan Details">
          <Row label="Period" value={plan.period} />
          <Row label="Currency" value={plan.currency} />
          <Row label="Effective" value={`${plan.effectiveFrom}${plan.effectiveTo ? ` — ${plan.effectiveTo}` : '+'}`} />
        </Section>

        {plan.metrics.length > 0 && (
          <Section title="Metrics">
            {plan.metrics.map(m => (
              <Row key={m.id} label={m.name} value={`${m.aggregation.type}${m.aggregation.type !== 'formula' && 'field' in m.aggregation ? ` of ${m.aggregation.field}` : ''}`} />
            ))}
          </Section>
        )}

        {plan.components.length > 0 && (
          <Section title="Components">
            {plan.components.map(c => (
              <Row key={c.id} label={c.name} value={c.earningsMethod.type} />
            ))}
          </Section>
        )}

        {plan.tierTables && plan.tierTables.length > 0 && (
          <Section title="Tier Tables">
            {plan.tierTables.map(t => (
              <div key={t.id} className="mb-2">
                <p className="text-xs font-medium text-gray-700 mb-1">{t.name} ({t.style})</p>
                {t.tiers.map((tier, i) => (
                  <p key={i} className="text-xs text-gray-500 pl-2">
                    {tier.label ?? `Tier ${i+1}`}: from {tier.from}{tier.to ? ` to ${tier.to}` : '+'}
                    {tier.rate.type === 'percent' ? ` → ${(tier.rate.value * 100).toFixed(1)}%` : ''}
                  </p>
                ))}
              </div>
            ))}
          </Section>
        )}

        {plan.spifs && plan.spifs.length > 0 && (
          <Section title="SPIFs">
            {plan.spifs.map(s => (
              <Row key={s.id} label={s.name} value={`${s.payout.type === 'fixed' ? `$${s.payout.value}` : s.payout.type} per trigger`} />
            ))}
          </Section>
        )}

        {plan.bounds && plan.bounds.length > 0 && (
          <Section title="Caps & Floors">
            {plan.bounds.map((b, i) => (
              <Row key={i} label={`${b.type} (${b.scope})`} value={b.amount.type === 'fixed' ? `$${b.amount.value.toLocaleString()}` : b.amount.type} />
            ))}
          </Section>
        )}

        {/* Raw DSL toggle */}
        <button
          onClick={() => setShowRaw(r => !r)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          {showRaw ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Raw DSL
        </button>
        {showRaw && (
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-64 text-gray-600">
            {JSON.stringify(plan, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value}</span>
    </div>
  )
}
