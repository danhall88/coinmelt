import { Database, Upload, Users } from 'lucide-react'
import Link from 'next/link'

export default function DataPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Data</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/data/import?type=transactions" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
          <Upload size={20} className="text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Import Transactions</h3>
          <p className="text-xs text-gray-500">Upload closed deal / booking records (CSV)</p>
        </Link>
        <Link href="/data/import?type=quotas" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
          <Database size={20} className="text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Import Quotas</h3>
          <p className="text-xs text-gray-500">Upload quota targets per rep per metric (CSV)</p>
        </Link>
        <Link href="/data/reps" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
          <Users size={20} className="text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Manage Reps</h3>
          <p className="text-xs text-gray-500">Add, edit, and assign reps to comp plans</p>
        </Link>
      </div>
    </div>
  )
}
