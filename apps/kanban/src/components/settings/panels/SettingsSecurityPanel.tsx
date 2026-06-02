'use client'

import Image from 'next/image'
import { Activity as PulseIcon, CheckCircle2, Key, Save, Settings, Trash2 } from 'lucide-react'
import { Achievement } from '@/types/database'
import { logActivity } from '@/utils/logging'
import { updateProfileById } from '@/services/dashboard'
import type { SettingsPageViewModel } from '../settings-types'
import { FormField } from '@/components/forms/FormField'

export function SettingsSecurityPanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
    isGithubLinked,
    isGoogleLinked,
    handleLinkIdentity,
    saving,
    customToolInput,
    setCustomToolInput,
    pendingAchievements,
    setPendingAchievements,
    saveConfirmation,
    setSaveConfirmation,
    setSaving,
    setError,
    refreshProfile,
    addToast,
  } = vm

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Identity Protocol & Integrations</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2rem' }}>
        Configure your technical credentials and project toolkit connections.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Primary Identity</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>{profile?.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 800, border: 'none' }}>
              ACTIVE_NODE
            </span>
            <button type="button" className="btn btn-sm btn-ghost" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}>
              Secure Registry
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <PulseIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>GitHub Connection</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                {isGithubLinked ? 'Identity Protocol Active' : 'One-click technical login'}
              </p>
            </div>
          </div>
          {isGithubLinked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
              <CheckCircle2 size={16} /> CONNECTED
            </div>
          ) : (
            <button type="button" onClick={() => handleLinkIdentity('github.com')} disabled={saving} className="btn btn-sm btn-primary" style={{ marginTop: '0.5rem', borderRadius: '10px' }}>
              {saving ? 'Syncing...' : 'Link GitHub Identity'}
            </button>
          )}
        </div>

        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Google Identity</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.75rem' }}>
                {isGoogleLinked ? 'Identity Protocol Active' : 'Credential synchronization'}
              </p>
            </div>
          </div>
          {isGoogleLinked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
              <CheckCircle2 size={16} /> CONNECTED
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleLinkIdentity('google.com')}
              disabled={saving}
              className="btn btn-sm btn-secondary"
              style={{ marginTop: '0.5rem', borderRadius: '10px', background: 'white', color: 'black', border: '1px solid var(--border)' }}
            >
              {saving ? 'Syncing...' : 'Link Google Identity'}
            </button>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CheckCircle2 color="var(--brand)" size={22} /> Technical Arsenal
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {(() => {
          const DEFAULT_TOOLS = ['React', 'Next.js', 'Tailwind', 'Node.js', 'Python', 'Firebase', 'PostgreSQL', 'AWS', 'Docker', 'Cloudflare', 'Figma', 'VS Code']

          const currentAchievements = pendingAchievements || profile?.achievements || []
          const activeTools = currentAchievements.map((a: Achievement) => a.name)

          const userCustomTools = currentAchievements.filter((a: Achievement) => !DEFAULT_TOOLS.includes(a.name)).map((a: Achievement) => a.name)

          const allDisplayTools = Array.from(new Set([...DEFAULT_TOOLS, ...userCustomTools]))

          const handleSyncArsenal = async () => {
            if (!profile || !pendingAchievements) return
            setSaving(true)
            try {
              await updateProfileById(profile.id, { achievements: pendingAchievements })
              logActivity(profile.id, profile.group_id || 'system', 'setting_updated', 'Overhauled technical arsenal')
              addToast('Arsenal Verified', 'Your updated toolkit has been saved to your academic record.', 'success')
              setPendingAchievements(null)
              setSaveConfirmation(false)
              refreshProfile()
            } catch {
              setError('Synchronization failed.')
            }
            setSaving(false)
          }

          return (
            <>
              {allDisplayTools.map((tool) => {
                const isConnected = activeTools.includes(tool)

                const toggleTool = () => {
                  const achievements = [...currentAchievements]
                  let next
                  if (isConnected) {
                    next = achievements.filter((a: Achievement) => a.name !== tool)
                  } else {
                    next = [...achievements, { name: tool, date: new Date().toISOString() }]
                  }
                  setPendingAchievements(next)
                }

                return (
                  <div
                    key={tool}
                    onClick={toggleTool}
                    style={{
                      padding: '1.25rem',
                      background: isConnected ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)',
                      border: isConnected ? '2px solid var(--brand)' : '1px solid var(--border)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      cursor: 'pointer',
                      transform: isConnected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isConnected ? 'var(--brand)' : 'var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isConnected ? 'white' : 'var(--text-sub)',
                        }}
                      >
                        <Settings size={16} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isConnected ? 'var(--text-main)' : 'var(--text-sub)' }}>{tool}</span>
                    </div>

                    <div style={{ padding: '0.4rem', color: isConnected ? 'var(--error)' : 'var(--brand)' }}>{isConnected ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}</div>
                  </div>
                )
              })}

              <div
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-sub)',
                  border: '1.5px dashed var(--border)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Settings size={14} color="var(--brand)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Add Custom</span>
                </div>
                <FormField label="Custom tool name" hideLabel>
                  <input
                    type="text"
                    placeholder="e.g. Docker"
                    value={customToolInput}
                    onChange={(e) => setCustomToolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customToolInput.trim()) {
                        const toolName = customToolInput.trim()
                        const achievements = currentAchievements
                        if (achievements.some((a: Achievement) => a.name.toLowerCase() === toolName.toLowerCase())) {
                          setError('This tool is already in your arsenal.')
                          return
                        }
                        setPendingAchievements([...achievements, { name: toolName, date: new Date().toISOString() }])
                        setCustomToolInput('')
                      }
                    }}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  />
                </FormField>
              </div>

              {pendingAchievements !== null && (
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.3s ease-out' }}>
                  <button type="button" className="btn btn-primary" onClick={() => setSaveConfirmation(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Save size={18} /> Synchronize Arsenal Changes
                  </button>
                </div>
              )}

              {saveConfirmation && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                  <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Commit Toolkit Update?</h3>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                      This will update your public scholar profile with the selected technical arsenal.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSaveConfirmation(false)}>
                        Cancel
                      </button>
                      <button type="button" className="btn btn-primary" onClick={handleSyncArsenal} disabled={saving}>
                        {saving ? 'Saving...' : 'Confirm Sync'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
