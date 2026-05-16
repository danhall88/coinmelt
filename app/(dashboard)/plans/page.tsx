import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, AlertCircle } from 'lucide-react'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('comp_plans')
    .select('id, name, status, period, effective_from, llm_confidence, requires_review, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Comp Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">{plans?.length ?? 0} plans</p>
        </div>
        <Link
          href="/plans/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> New plan
        </Link>
      </div>

      {!plans?.length ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FileText size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">No plans yet</p>
          <p className="text-xs text-gray-400 mb-4">Describe your comp plan in plain English and AI will structure it</p>
          <Link href="/plans/new" className="text-sm text-indigo-600 font-medium hover:underline">Create your first plan</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400">{plan.period} · effective {plan.effective_from}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {plan.requires_review && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertCircle size={10} /> Review needed
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  plan.status === 'active' ? 'bg-green-50 text-green-700' :
                  plan.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {plan.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
