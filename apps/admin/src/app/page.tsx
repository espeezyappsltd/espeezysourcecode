'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Activity, Users, FolderKanban, MessageSquare, AlertCircle, RefreshCcw, Shield, Database, LayoutDashboard } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns' // Nextjs standard, we'll just do manual if not installed
import Link from 'next/link'

// Mock chart data for visual density
const MOCK_TREND = [
  { name: 'Mon', users: 4000, activity: 2400 },
  { name: 'Tue', users: 3000, activity: 1398 },
  { name: 'Wed', users: 2000, activity: 9800 },
  { name: 'Thu', users: 2780, activity: 3908 },
  { name: 'Fri', users: 1890, activity: 4800 },
  { name: 'Sat', users: 2390, activity: 3800 },
  { name: 'Sun', users: 3490, activity: 4300 },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [activityFeed, setActivityFeed] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAccessAndFetch()
  }, [])

  const checkAccessAndFetch = async () => {
    try {
      setLoading(true)
      setError(null)
      setNeedsLogin(false)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Not logged in
        setNeedsLogin(true)
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin/metrics')
      if (res.status === 401 || res.status === 403) {
        setError("You do not have permission to view this super-admin dashboard.")
        setLoading(false)
        return
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setMetrics(data.metrics)
      setActivityFeed(data.recentActivity || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCcw size={24} color="var(--brand)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Initializing Secure Dashboard...</span>
        </div>
        <style jsx>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (needsLogin) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '2.5rem', borderRadius: '24px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Shield size={48} color="var(--brand)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Admin Login</h2>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Authenticate to access the control center.</p>
          
          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            const email = (e.target as any).email.value;
            const password = (e.target as any).password.value;
            setLoading(true);
            setLoginError(null);
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
               setLoginError(signInError.message);
               setLoading(false);
            } else {
               window.location.reload();
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input name="email" type="email" placeholder="Email" required style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.95rem' }} />
            <input name="password" type="password" placeholder="Password" required style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.95rem' }} />
            <button type="submit" style={{ padding: '0.85rem', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Log In
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', textAlign: 'center' }}>
          <Shield size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#fca5a5' }}>Access Denied</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            Return to Safety
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Top Navbar */}
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--brand)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', lineHeight: 1 }}>Control Center</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px', fontWeight: 700 }}>Super Admin</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={checkAccessAndFetch} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <RefreshCcw size={12} /> Refresh
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <KpiCard icon={<Users size={20} />} label="Total Users" value={metrics?.total_users || 0} trend="+12% this week" />
          <KpiCard icon={<FolderKanban size={20} />} label="Active Groups" value={metrics?.active_groups || 0} trend="+3 new today" />
          <KpiCard icon={<Activity size={20} />} label="Active Tasks" value={metrics?.active_tasks || 0} trend="Stable" />
          <KpiCard icon={<MessageSquare size={20} />} label="Total Messages" value={metrics?.total_messages || 0} trend="High volume" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Chart Section */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LayoutDashboard size={16} /> Platform Activity Trend
            </h3>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TREND} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: 'white', fontSize: '0.8rem' }}
                  />
                  <Area type="monotone" dataKey="activity" stroke="var(--brand)" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Live Event Stream
            </h3>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activityFeed.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem 0' }}>No recent activity.</div>
              ) : (
                activityFeed.map((event: any) => (
                  <div key={event.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand)', marginTop: '6px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 500, marginBottom: '2px' }}>
                        <span style={{ color: 'var(--brand)' }}>{event.actor_name || 'System'}</span> {event.message || event.action}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(event.created_at).toLocaleString()} {event.group_name && `· ${event.group_name}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}

function KpiCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string | number, trend: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
        {icon}
        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--brand)', marginTop: '0.5rem', fontWeight: 600 }}>{trend}</div>
      </div>
    </div>
  )
}
