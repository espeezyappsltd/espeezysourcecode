'use client'

import { Briefcase, Users, CheckCircle, ListTodo } from 'lucide-react'
import { STUDIO_LOADING_METRIC } from '@/lib/studio/ui-copy'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'

export default function DashboardMetrics() {
  const { projects, jobs, team, completed, loading } = useDashboardMetrics();
  const metrics = [
    {
      icon: <Briefcase size={28} color="#6366f1" aria-hidden />,
      label: 'Projects',
      value: loading ? STUDIO_LOADING_METRIC : projects,
      color: '#6366f1',
    },
    {
      icon: <ListTodo size={28} color="#f59e42" aria-hidden />,
      label: 'Active Jobs',
      value: loading ? STUDIO_LOADING_METRIC : jobs,
      color: '#f59e42',
    },
    {
      icon: <Users size={28} color="#10b981" aria-hidden />,
      label: 'Team Members',
      value: loading ? STUDIO_LOADING_METRIC : team,
      color: '#10b981',
    },
    {
      icon: <CheckCircle size={28} color="#22c55e" aria-hidden />,
      label: 'Completed',
      value: loading ? STUDIO_LOADING_METRIC : completed,
      color: '#22c55e',
    },
  ];

  return (
    <div className="studio-dashboard-metrics" role="list" aria-label="Studio metrics">
      {metrics.map((m, i) => (
        <div
          key={m.label}
          role="listitem"
          className="dashboard-metric-card control-card-entrance"
          style={{
            borderColor: `${m.color}22`,
            animationDelay: `${i * 0.08 + 0.1}s`,
          }}
        >
          <div className="studio-dashboard-metrics__icon">{m.icon}</div>
          <div className="studio-dashboard-metrics__value" style={{ color: m.color }}>
            {m.value}
          </div>
          <div className="studio-dashboard-metrics__label">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
