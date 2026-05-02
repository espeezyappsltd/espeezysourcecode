'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import {
  Users, AlertTriangle, Activity, MessageSquare, DollarSign,
  Search, Loader2, CheckCircle, XCircle, Ban, Send, Mail, ShieldAlert
} from 'lucide-react'

type AdminTab = 'users' | 'activity' | 'feedback' | 'payout' | 'email' | 'errors'

interface UserRow {
  id: string; full_name: string; email: string
  account_status: string; subscription_plan: string; created_at: string
  stripe_account_status?: string; role?: string
}

interface ActivityRow {
  id: string; created_at: string; action: string; resource_type?: string
  severity: string; user_id: string
  profile?: { full_name: string; email: string }
}

interface FeedbackRow {
  id: string; created_at: string; feedback_type: string; message: string; rating?: number
  profile?: { full_name: string; email: string }
}

interface Campaign {
  id: string; title: string; subject: string; status: string
  sent_count: number; created_at: string; sent_at?: string
}

interface ServerError {
  id: number; route?: string; method?: string; message: string; stack?: string; created_at: string
}

const db = createBrowserSupabaseClient()

export default function AdminExtras() {
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<UserRow[]>([])
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Payout state
  const [payoutRecipient, setPayoutRecipient] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [payoutError, setPayoutError] = useState('')
  const [payoutSuccess, setPayoutSuccess] = useState('')
  const [sendingPayout, setSendingPayout] = useState(false)

  // Email campaign state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignSubject, setCampaignSubject] = useState('')
  const [campaignPreview, setCampaignPreview] = useState('')
  const [campaignBody, setCampaignBody] = useState('')
  const [sendingCampaign, setSendingCampaign] = useState(false)
  const [campaignMsg, setCampaignMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Server error log state
  const [serverErrors, setServerErrors] = useState<ServerError[]>([])
  const [errorsLoading, setErrorsLoading] = useState(false)
  const [expandedError, setExpandedError] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('profiles')
      .select('id, full_name, email, account_status, subscription_plan, created_at, stripe_account_status, role')
      .order('created_at', { ascending: false })
      .limit(50)
    setUsers(data ?? [])
    setLoading(false)
  }, [])

  const loadActivity = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('activity_log')
      .select('id, created_at, action, resource_type, severity, user_id')
      .order('created_at', { ascending: false })
      .limit(100)
    setActivity(data ?? [])
    setLoading(false)
  }, [])

  const loadFeedback = useCallback(async () => {
    setLoading(true)
    const { data } = await db
      .from('user_feedback')
      .select('id, created_at, feedback_type, message, rating, user_id')
      .order('created_at', { ascending: false })
      .limit(100)
    setFeedback(data ?? [])
    setLoading(false)
  }, [])

  const loadCampaigns = useCallback(async () => {
    const res = await fetch('/api/admin/email-campaigns')
    if (res.ok) {
      const json = await res.json()
      setCampaigns(json.campaigns ?? [])
    }
  }, [])

  const loadServerErrors = useCallback(async () => {
    setErrorsLoading(true)
    try {
      const res = await fetch('/api/admin/server-errors')
      if (!res.ok) throw new Error(`Failed to load server errors (${res.status})`)
      const json = await res.json()
      setServerErrors(json.errors ?? [])
    } catch (e) {
      setServerErrors([])
      console.error('loadServerErrors:', (e as Error).message)
    } finally {
      setErrorsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tab === 'users') loadUsers()
    else if (tab === 'activity') loadActivity()
    else if (tab === 'feedback') loadFeedback()
    else if (tab === 'email') loadCampaigns()
    else if (tab === 'errors') loadServerErrors()
  }, [tab, loadUsers, loadActivity, loadFeedback, loadCampaigns, loadServerErrors])

  async function sendCampaign() {
    if (!campaignTitle || !campaignSubject || !campaignBody) return
    setSendingCampaign(true); setCampaignMsg(null)
    try {
      const res = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignTitle,
          subject: campaignSubject,
          preview: campaignPreview,
          html_body: campaignBody,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCampaignMsg({ ok: false, text: data.error ?? 'Failed to send campaign' })
      } else {
        setCampaignMsg({ ok: true, text: `✓ Sent to ${data.sent_count} of ${data.total_recipients} recipients.` })
        setCampaignTitle(''); setCampaignSubject(''); setCampaignPreview(''); setCampaignBody('')
        loadCampaigns()
      }
    } catch (e) {
      setCampaignMsg({ ok: false, text: (e as Error).message })
    } finally {
      setSendingCampaign(false)
    }
  }

  async function setAccountStatus(userId: string, status: 'active' | 'suspended' | 'deactivated') {
    setActionLoading(userId)
    const { error } = await db.from('profiles').update({ account_status: status }).eq('id', userId)
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, account_status: status } : u))
    setActionLoading(null)
  }

  async function sendPayout() {
    setPayoutError(''); setPayoutSuccess(''); setSendingPayout(true)
    try {
      const res = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: payoutRecipient,
          amount_cents: Math.round(parseFloat(payoutAmount) * 100),
          note: payoutNote,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setPayoutError(data.error ?? 'Failed'); return }
      setPayoutSuccess(`Transfer sent! ID: ${data.transfer_id}`)
      setPayoutRecipient(''); setPayoutAmount(''); setPayoutNote('')
    } finally { setSendingPayout(false) }
  }

  const statusColor: Record<string, string> = {
    active: '#10B981', suspended: '#F59E0B', deactivated: '#EF4444',
  }

  const severityColor: Record<string, string> = {
    info: 'rgba(255,255,255,0.25)', warning: '#F59E0B', error: '#EF4444', critical: '#EF4444',
  }

  const filteredUsers = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const TABS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'User Management', icon: <Users size={14} /> },
    { key: 'activity', label: 'Activity Log', icon: <Activity size={14} /> },
    { key: 'feedback', label: 'User Feedback', icon: <MessageSquare size={14} /> },
    { key: 'payout', label: 'Admin Payout', icon: <DollarSign size={14} /> },
    { key: 'email', label: 'Email Marketing', icon: <Mail size={14} /> },
    { key: 'errors', label: 'Error Log', icon: <ShieldAlert size={14} /> },
  ]

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 950, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#F3F4F6' }}>
        Platform <span style={{ color: '#10B981' }}>Operations</span>
      </h2>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
            background: tab === t.key ? '#10B981' : 'rgba(255,255,255,0.05)',
            color: tab === t.key ? '#000' : 'rgba(255,255,255,0.5)',
            fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
          }}>{t.icon}{t.label}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={22} style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }} /></div>}

      {/* ─── Users ─── */}
      {!loading && tab === 'users' && (
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <Search size={14} color="rgba(255,255,255,0.3)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E5E7EB', fontSize: '0.85rem', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Name', 'Email', 'Plan', 'Status', 'Stripe', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 800, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '0.7rem 1rem', color: '#E5E7EB', fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ padding: '0.7rem 1rem', color: 'rgba(255,255,255,0.4)' }}>{u.email}</td>
                    <td style={{ padding: '0.7rem 1rem' }}><span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', borderRadius: '5px', textTransform: 'uppercase' }}>{u.subscription_plan ?? 'free'}</span></td>
                    <td style={{ padding: '0.7rem 1rem' }}><span style={{ color: statusColor[u.account_status] ?? '#888', fontWeight: 800, fontSize: '0.75rem' }}>{u.account_status ?? 'active'}</span></td>
                    <td style={{ padding: '0.7rem 1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>{u.stripe_account_status ?? '—'}</td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      {actionLoading === u.id ? <Loader2 size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> : (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {u.account_status !== 'active' && (
                            <button onClick={() => setAccountStatus(u.id, 'active')} title="Activate" style={{ background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#10B981', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 }}>Activate</button>
                          )}
                          {u.account_status !== 'suspended' && u.role !== 'admin' && (
                            <button onClick={() => setAccountStatus(u.id, 'suspended')} title="Suspend" style={{ background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#F59E0B', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 }}>Suspend</button>
                          )}
                          {u.account_status !== 'deactivated' && u.role !== 'admin' && (
                            <button onClick={() => { if (window.confirm(`Permanently deactivate ${u.full_name}?`)) setAccountStatus(u.id, 'deactivated') }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '4px 8px', color: '#EF4444', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800 }}>Deactivate</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No users found</div>}
          </div>
        </div>
      )}

      {/* ─── Activity Log ─── */}
      {!loading && tab === 'activity' && (
        <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Time', 'User', 'Action', 'Resource', 'Severity'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 800, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                  <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.user_id.slice(0, 8)}…</td>
                  <td style={{ padding: '0.6rem 1rem', color: '#E5E7EB', fontWeight: 700 }}>{a.action}</td>
                  <td style={{ padding: '0.6rem 1rem', color: 'rgba(255,255,255,0.4)' }}>{a.resource_type ?? '—'}</td>
                  <td style={{ padding: '0.6rem 1rem' }}><span style={{ color: severityColor[a.severity] ?? 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>{a.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {activity.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No activity logged yet</div>}
        </div>
      )}

      {/* ─── User Feedback ─── */}
      {!loading && tab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {feedback.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No feedback submitted yet</div>}
          {feedback.map(f => (
            <div key={f.id} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', borderRadius: '5px', textTransform: 'uppercase' }}>{f.feedback_type}</span>
                  {f.rating && <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{f.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Admin Payout ─── */}
      {tab === 'payout' && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              <strong style={{ color: '#EF4444' }}>⚠ Admin action.</strong> This sends real money via Stripe. The recipient must have an active connected bank account. All payouts are logged.
            </p>
          </div>
          {payoutError && <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#EF4444' }}>{payoutError}</div>}
          {payoutSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#10B981' }}>{payoutSuccess}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Recipient User ID</label>
              <input value={payoutRecipient} onChange={e => setPayoutRecipient(e.target.value)} placeholder="UUID of recipient" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Amount (USD)</label>
              <input value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="e.g. 50.00" type="number" min="1" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Note (optional)</label>
              <input value={payoutNote} onChange={e => setPayoutNote(e.target.value)} placeholder="Reason for payment…" maxLength={200} style={inputStyle} />
            </div>
            <button
              onClick={sendPayout}
              disabled={!payoutRecipient || !payoutAmount || sendingPayout}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                background: '#10B981', border: 'none', borderRadius: '10px', color: '#000',
                fontWeight: 900, fontSize: '0.85rem', padding: '0.75rem', cursor: 'pointer',
                opacity: (!payoutRecipient || !payoutAmount || sendingPayout) ? 0.5 : 1,
              }}
            >
              {sendingPayout ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              Send Payout
            </button>
          </div>
        </div>
      )}

      {/* ─── Email Marketing ─── */}
      {tab === 'email' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Compose form */}
          <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#F3F4F6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} style={{ color: '#10B981' }} /> Compose Campaign
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
              Only users who have opted in to Marketing Emails will receive this. They will also get a persistent in-app notification.
            </p>
            {campaignMsg && (
              <div style={{ borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.82rem', background: campaignMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: campaignMsg.ok ? '#10B981' : '#EF4444' }}>{campaignMsg.text}</div>
            )}
            <div>
              <label style={labelStyle}>Campaign Title (internal)</label>
              <input value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} placeholder="e.g. April Newsletter" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Subject</label>
              <input value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} placeholder="e.g. Big updates at Espeezy 🚀" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Preview Text (optional)</label>
              <input value={campaignPreview} onChange={e => setCampaignPreview(e.target.value)} placeholder="Short summary shown in inbox…" maxLength={200} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Body (HTML supported)</label>
              <textarea
                value={campaignBody}
                onChange={e => setCampaignBody(e.target.value)}
                placeholder={'<h2>Hi there!</h2>\n<p>We have exciting news for you...</p>'}
                rows={8}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
            <button
              onClick={sendCampaign}
              disabled={!campaignTitle || !campaignSubject || !campaignBody || sendingCampaign}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: '#10B981', border: 'none', borderRadius: '10px', color: '#000',
                fontWeight: 900, fontSize: '0.85rem', padding: '0.85rem', cursor: 'pointer',
                opacity: (!campaignTitle || !campaignSubject || !campaignBody || sendingCampaign) ? 0.5 : 1,
              }}
            >
              {sendingCampaign ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              {sendingCampaign ? 'Sending…' : 'Send to All Opted-In Users'}
            </button>
          </div>

          {/* Campaign history */}
          <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#F3F4F6' }}>Campaign History</h3>
              <button onClick={loadCampaigns} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '4px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
            </div>
            {campaigns.length === 0 && <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No campaigns yet</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ background: '#111', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#E5E7EB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.subject}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : new Date(c.created_at).toLocaleDateString()} · {c.sent_count} sent
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '5px', textTransform: 'uppercase',
                    background: c.status === 'sent' ? 'rgba(16,185,129,0.1)' : c.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: c.status === 'sent' ? '#10B981' : c.status === 'failed' ? '#EF4444' : '#F59E0B' }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Error Log ─── */}
      {tab === 'errors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
              Most recent 100 internal server errors. Copy the message and paste it into Copilot to fix.
            </p>
            <button onClick={loadServerErrors} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '4px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>Refresh</button>
          </div>
          {errorsLoading && <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}><Loader2 size={22} style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }} /></div>}
          {!errorsLoading && serverErrors.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#0d0d0d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              🟢 No errors logged
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {serverErrors.map(e => (
              <div key={e.id} style={{ background: '#0d0d0d', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '0.9rem 1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {e.route && <span style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{e.method ?? 'GET'} {e.route}</span>}
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => setExpandedError(expandedError === e.id ? null : e.id)}
                    style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--brand, #10B981)', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {expandedError === e.id ? 'Hide stack' : 'Full stack'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <code style={{ flex: 1, fontSize: '0.8rem', color: '#EF4444', background: 'rgba(239,68,68,0.05)', borderRadius: '6px', padding: '0.4rem 0.6rem', display: 'block', wordBreak: 'break-all' }}>{e.message}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(e.stack ? `${e.message}\n\n${e.stack}` : e.message)}
                    style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '4px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Copy
                  </button>
                </div>
                {expandedError === e.id && e.stack && (
                  <pre style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', background: '#080808', borderRadius: '6px', padding: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{e.stack}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.65rem 0.9rem', color: '#F3F4F6', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }
