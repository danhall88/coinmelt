import { Zap, Play } from 'lucide-react'

export default function ResultsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Results</h1>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Play size={14} /> New run
        </button>
      </div>
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Zap size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-600">No calculation runs yet</p>
        <p className="text-xs text-gray-400">Create a plan and import data first, then run calculations</p>
      </div>
    </div>
  )
}
