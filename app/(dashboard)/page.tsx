import Link from 'next/link'
import { FileText, Database, Zap, ArrowRight } from 'lucide-react'

const QUICK_ACTIONS = [
  {
    href: '/plans/new',
    icon: FileText,
    title: 'Create a comp plan',
    description: 'Describe your plan in plain English — AI converts it to structured logic',
    cta: 'Start building',
  },
  {
    href: '/data',
    icon: Database,
    title: 'Import data',
    description: 'Upload transactions, quotas, and rep records via CSV',
    cta: 'Import CSV',
  },
  {
    href: '/results',
    icon: Zap,
    title: 'Run calculations',
    description: 'Calculate payments for all reps and generate statements',
    cta: 'Run now',
  },
]

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Incentive Compensation Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {QUICK_ACTIONS.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <action.icon size={20} className="text-indigo-500 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{action.title}</h3>
            <p className="text-xs text-gray-500 mb-3">{action.description}</p>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              {action.cta} <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <p className="text-sm font-medium text-indigo-900 mb-1">Getting started</p>
        <p className="text-sm text-indigo-700">
          1. Create a comp plan by describing it in plain English &rarr; 2. Import your sales data &rarr; 3. Run calculations &rarr; 4. Export statements
        </p>
      </div>
    </div>
  )
}
