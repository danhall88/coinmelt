import Link from 'next/link'
import { CreditCard, Users } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Link href="/settings/billing" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
          <CreditCard size={20} className="text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Billing</h3>
          <p className="text-xs text-gray-500">Manage your subscription and seats</p>
        </Link>
        <Link href="/settings/team" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
          <Users size={20} className="text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Team</h3>
          <p className="text-xs text-gray-500">Invite admins and managers</p>
        </Link>
      </div>
    </div>
  )
}
