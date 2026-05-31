'use client'

import Link from 'next/link'
import { Plus, UserPlus, BarChart3 } from 'lucide-react'

const actions = [
  { icon: <Plus size={20} />, label: 'Jobs queue', href: '/jobs' },
  { icon: <BarChart3 size={20} />, label: 'Analytics', href: '/analytics' },
  { icon: <UserPlus size={20} />, label: 'Team', href: '/team' },
]

export default function DashboardQuickActions() {
  return (
    <div className="studio-quick-actions">
      {actions.map((a) => (
        <Link key={a.href} href={a.href} className="studio-quick-actions__btn">
          {a.icon}
          <span>{a.label}</span>
        </Link>
      ))}
    </div>
  )
}
