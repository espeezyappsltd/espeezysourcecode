"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { Briefcase, Users, CheckCircle, ListTodo } from 'lucide-react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export default function DashboardMetrics() {
  const { projects, jobs, team, completed, loading } = useDashboardMetrics();
  const metrics = [
    {
      icon: <Briefcase size={28} color="#6366f1" />,
      label: 'Projects',
      value: loading ? '—' : projects,
      color: '#6366f1',
    },
    {
      icon: <ListTodo size={28} color="#f59e42" />,
      label: 'Active Jobs',
      value: loading ? '—' : jobs,
      color: '#f59e42',
    },
    {
      icon: <Users size={28} color="#10b981" />,
      label: 'Team Members',
      value: loading ? '—' : team,
      color: '#10b981',
    },
    {
      icon: <CheckCircle size={28} color="#22c55e" />,
      label: 'Completed',
      value: loading ? '—' : completed,
      color: '#22c55e',
    },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        margin: '2.5rem 0 2rem 0',
        width: '100%',
        maxWidth: 900,
      }}
    >
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className="dashboard-metric-card control-card-entrance"
          style={{
            padding: '1.5rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.7rem',
            border: `2px solid ${m.color}22`,
            minHeight: 120,
            animationDelay: `${i * 0.08 + 0.1}s`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{m.icon}</div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--studios-muted)' }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}
