'use client'

import { useState } from 'react'
import { LayoutDashboard, Calendar, History, Activity, Zap, TrendingUp, Award, UserCircle, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'board' | 'calendar'>('board')
  
  // MOCK DATA
  const mockProfile = {
    full_name: 'Demo Student',
    avatar_url: null,
    total_score: 450,
    group_id: 'demo-group'
  }

  const mockTasks = [
    { id: '1', title: 'Design System Implementation', status: 'In Progress', category: 'UX/UI Design', assignees: ['demo-user'] },
    { id: '2', title: 'Database Schema Audit', status: 'Done', category: 'Architecture', assignees: ['demo-user'] },
    { id: '3', title: 'API Security Protocol v3', status: 'To Do', category: 'Implementation', assignees: ['demo-user'] },
    { id: '4', title: 'Research Abstract Drafting', status: 'In Review', category: 'Documentation', assignees: ['demo-user'] },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', paddingBottom: '5rem' }}>
      
      {/* Sandbox Banner */}
      <div style={{ 
        background: 'var(--brand)', 
        color: 'white', 
        padding: '0.75rem 1rem', 
        textAlign: 'center', 
        fontSize: '0.85rem', 
        fontWeight: 800,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <Zap size={16} />
        <span>🚀 SANDBOXED DEMO: This environment is local to your session and resets every 24 hours.</span>
        <Link href="/login" style={{ color: 'white', textDecoration: 'underline', marginLeft: '1rem' }}>Join for real</Link>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem var(--p-safe)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ padding: '6px', background: 'var(--brand)', borderRadius: '10px' }}>
                 <Activity size={20} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.25rem' }}>Espeezy Demo</span>
           </Link>
           <Link href="/login" className="btn btn-primary btn-sm btn-inline" style={{ width: 'auto' }}>Create Account</Link>
        </div>

        {/* HUD */}
        <div className="hud-card" style={{
          padding: '1.5rem 2rem', borderRadius: '24px', background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem',
          boxShadow: 'var(--shadow-md)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '24px', border: '2px solid var(--border)', background: 'var(--bg-sub)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <UserCircle size={40} color="var(--text-sub)" />
            </div>
            <div>
              <h2 className="fluid-h1" style={{ fontWeight: 900, marginBottom: '8px' }}>Welcome, Explorer</h2>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ color: 'var(--brand)' }}>DEMO MODE</span>
                 <span style={{ opacity: 0.3 }}>•</span>
                 <span>4 ACTIVE TASKS IN THIS SANDBOX</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-start' }}>
            {[
              { icon: <Zap size={16} />, label: 'Points', value: 450, color: 'var(--brand)' },
              { icon: <TrendingUp size={16} />, label: 'Rank', value: 'Senior', color: 'var(--success)' },
              { icon: <Award size={16} />, label: 'Badges', value: 12, color: '#f59e0b' }
            ].map((stat, i) => (
              <div key={i} style={{ padding: '0.75rem 1rem', borderRadius: '18px', background: 'var(--bg-main)', border: '1px solid var(--border)', flex: '1 1 120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-sub)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span> {stat.label}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Board Simulation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Project Phoenix</h1>
            <p style={{ color: 'var(--text-sub)', marginTop: '0.6rem', fontWeight: 600 }}>Try moving tasks around (simulation)</p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-sub)', padding: '0.4rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <button className="btn btn-sm btn-primary btn-inline" style={{ padding: '0.65rem 1.5rem' }}>Board</button>
            <button className="btn btn-sm btn-ghost btn-inline" style={{ padding: '0.65rem 1.5rem' }}>Calendar</button>
          </div>
        </div>

        <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', minHeight: '60vh' }}>
          {['To Do', 'In Progress', 'In Review', 'Done'].map(col => (
            <div key={col} style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-sub)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>{col}</div>
              {mockTasks.filter(t => t.status === col).map(t => (
                <div key={t.id} className="kanban-card" style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{t.title}</div>
                  <div className="badge" style={{ fontSize: '0.65rem', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)' }}>{t.category}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div style={{ padding: '2rem', background: 'rgba(var(--brand-rgb), 0.05)', borderRadius: '24px', border: '1px dashed var(--brand)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
           <Info size={32} color="var(--brand)" />
           <div>
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>About this Academic Sandbox</h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                Espeezy is part of a 2026 research module focusing on <strong>Fair Group Work</strong>. 
                In this demo environment, database writes are disabled. Full features like real-time activity tracking, 
                Score Extraction, and Work History are available in the authenticated platform.
              </p>
           </div>
        </div>

      </div>

      <style jsx>{`
        .hud-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--brand); }
        .kanban-card:hover { transform: translateY(-3px); border-color: var(--brand); cursor: pointer; }
      `}</style>
    </div>
  )
}
