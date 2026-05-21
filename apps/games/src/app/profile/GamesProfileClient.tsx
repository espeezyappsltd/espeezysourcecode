'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Award,
  Calendar,
  Edit2,
  FolderOpen,
  Gamepad2,
  HardDrive,
  Mail,
  Check,
  X,
  Zap,
  ExternalLink,
} from 'lucide-react'
import { formatStorageBytes } from '@shared/storage-quotas'
import { buildGamesPublicProfileUrl } from '@shared/cross-app-auth'
import type { LoadedGamesProfile } from '@/lib/profile/load-games-profile'
import { useKanbanAppLink } from '@/hooks/useKanbanAppLink'
import { getSupabaseClient } from '@/lib/supabase-client'
import './profile.css'

function skirmishLevel(score: number) {
  if (score < 500) return { level: 1, name: 'Rookie', next: 500, color: '#94a3b8' }
  if (score < 2000) return { level: 2, name: 'Contender', next: 2000, color: '#10b981' }
  if (score < 5000) return { level: 3, name: 'Veteran', next: 5000, color: '#6366f1' }
  if (score < 10000) return { level: 4, name: 'Champion', next: 10000, color: '#f59e0b' }
  return { level: 5, name: 'Legend', next: 20000, color: '#fbbf24' }
}

function storageFillClass(percent: number): string {
  if (percent >= 90) return 'critical'
  if (percent >= 75) return 'warn'
  return ''
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function GamesProfileClient({ data }: { data: LoadedGamesProfile }) {
  const { profile, stats, storage, folders, vaultFileCount, recentSessions } = data
  const kanbanUrl = useKanbanAppLink('/')
  const arsenalUrl = useKanbanAppLink('/assets')

  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState(profile.biography ?? '')
  const [savedBio, setSavedBio] = useState(profile.biography ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const displayName = profile.full_name ?? profile.username ?? 'Player'
  const handle = profile.username ? `@${profile.username}` : null
  const plan = (profile.subscription_plan ?? profile.tier ?? 'free').toLowerCase()
  const level = useMemo(() => skirmishLevel(stats.totalScore), [stats.totalScore])
  const progressToNext = Math.min(100, Math.round((stats.totalScore / level.next) * 100))
  const publicProfileUrl = profile.username ? buildGamesPublicProfileUrl(profile.username) : null

  const headerClass =
    plan === 'premium'
      ? 'games-profile__header games-profile__header--premium'
      : plan === 'pro'
        ? 'games-profile__header games-profile__header--pro'
        : 'games-profile__header'

  const avatarClass =
    plan === 'premium'
      ? 'games-profile__avatar games-profile__avatar--premium'
      : plan === 'pro'
        ? 'games-profile__avatar games-profile__avatar--pro'
        : 'games-profile__avatar'

  const handleSaveBio = async () => {
    setIsSaving(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Not signed in')
      const { error } = await supabase
        .from('profiles')
        .update({ biography: bioText.trim() || null })
        .eq('id', profile.id)
      if (error) throw error
      setSavedBio(bioText.trim())
      setIsEditingBio(false)
    } catch (err) {
      console.error('Save bio error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="games-profile">
      <div className="games-profile__inner">
        <header className={headerClass}>
          <div className="games-profile__header-glow" aria-hidden />
          <div className="games-profile__identity">
            <div className={avatarClass}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#a5b4fc' }}>
                  {displayName[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div style={{ flex: '1 1 280px' }}>
              <p className="games-profile__eyebrow">Espeezy Games · Skirmish</p>
              <h1 className="games-profile__name">{displayName}</h1>
              {handle && <p className="games-profile__handle">{handle}</p>}
              {profile.tagline && (
                <p style={{ margin: '0.5rem 0 0', color: '#cbd5e1', fontSize: '0.88rem' }}>{profile.tagline}</p>
              )}
              <div className="games-profile__badges">
                <span className={`games-profile__badge games-profile__badge--plan ${plan}`}>
                  <Zap size={12} />
                  {plan} plan
                </span>
                <span className="games-profile__badge games-profile__badge--plan">
                  <Gamepad2 size={12} />
                  Level {level.level} · {level.name}
                </span>
                {(profile.badges_count ?? 0) > 0 && (
                  <span className="games-profile__badge games-profile__badge--plan">
                    <Award size={12} />
                    {profile.badges_count} badges
                  </span>
                )}
              </div>
              <div className="games-profile__meta">
                {profile.email && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} />
                    {profile.email}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  Member since {formatSessionDate(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="games-profile__actions">
            <a href={kanbanUrl} className="games-profile__btn games-profile__btn--primary">
              Open Kanban
            </a>
            <Link href="/categories" className="games-profile__btn games-profile__btn--secondary">
              Browse skirmishes
            </Link>
            {publicProfileUrl && (
              <a href={publicProfileUrl} className="games-profile__btn games-profile__btn--ghost">
                Public profile
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </header>

        <div className="games-profile__grid">
          <section className="games-profile__card">
            <h2 className="games-profile__card-title">
              <Gamepad2 size={16} />
              Skirmish record
            </h2>
            <div className="games-profile__stats">
              <div className="games-profile__stat">
                <span className="games-profile__stat-value">{stats.gamesPlayed}</span>
                <span className="games-profile__stat-label">Completed</span>
              </div>
              <div className="games-profile__stat">
                <span className="games-profile__stat-value">{stats.totalScore.toLocaleString()}</span>
                <span className="games-profile__stat-label">Total score</span>
              </div>
              <div className="games-profile__stat">
                <span className="games-profile__stat-value">
                  ${(stats.totalPrizeCents / 100).toFixed(2)}
                </span>
                <span className="games-profile__stat-label">Cash prizes</span>
              </div>
              <div className="games-profile__stat">
                <span className="games-profile__stat-value">{stats.activeSessions}</span>
                <span className="games-profile__stat-label">In progress</span>
              </div>
            </div>
            <p style={{ margin: '1rem 0 0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              {level.name} — {stats.totalScore.toLocaleString()} / {level.next.toLocaleString()} to next rank
            </p>
            <div className="games-profile__level-bar">
              <div
                className="games-profile__level-fill"
                style={{ width: `${progressToNext}%`, background: `linear-gradient(90deg, ${level.color}, #818cf8)` }}
              />
            </div>
          </section>

          <section className="games-profile__card">
            <h2 className="games-profile__card-title">
              <HardDrive size={16} />
              Personal storage
            </h2>
            <div className="games-profile__storage">
              <div className="games-profile__storage-head">
                <span>
                  <strong>{formatStorageBytes(storage.used)}</strong> of {formatStorageBytes(storage.quota)} used
                </span>
                <span>{storage.percentUsed}% · {storage.plan}</span>
              </div>
              <div className="games-profile__storage-bar">
                <div
                  className={`games-profile__storage-fill ${storageFillClass(storage.percentUsed)}`}
                  style={{ width: `${storage.percentUsed}%` }}
                />
              </div>
            </div>
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Shared with your Kanban Personal Arsenal. Uploads, marketplace buys, and folder markers count toward this
              quota.
            </p>
            <a
              href={arsenalUrl}
              className="games-profile__btn games-profile__btn--ghost"
              style={{ marginTop: '0.85rem' }}
            >
              <FolderOpen size={15} />
              Manage in Personal Arsenal
            </a>
          </section>

          <section className="games-profile__card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="games-profile__card-title">
              <FolderOpen size={16} />
              Folder system
              <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#64748b' }}>
                {vaultFileCount} file{vaultFileCount === 1 ? '' : 's'} in vault
              </span>
            </h2>
            <div className="games-profile__folders">
              {folders.map((folder) => (
                <div key={folder.path} className="games-profile__folder">
                  <div>
                    <div className="games-profile__folder-name">{folder.name}</div>
                    {folder.description && (
                      <p className="games-profile__folder-desc">{folder.description}</p>
                    )}
                  </div>
                  <span className="games-profile__folder-count">
                    {folder.fileCount} item{folder.fileCount === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="games-profile__card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="games-profile__card-title">
              <Zap size={16} />
              Recent sessions
            </h2>
            {recentSessions.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>
                No skirmishes yet.{' '}
                <Link href="/categories" style={{ color: '#818cf8', fontWeight: 700 }}>
                  Pick a category →
                </Link>
              </p>
            ) : (
              <ul className="games-profile__sessions">
                {recentSessions.map((session) => (
                  <li key={session.id} className="games-profile__session">
                    <div>
                      <strong>{session.categoryName ?? 'Skirmish'}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        {formatSessionDate(session.completed_at ?? session.created_at)}
                        {session.score != null && ` · ${session.score} pts`}
                        {(session.prize_cents_won ?? 0) > 0 &&
                          ` · $${((session.prize_cents_won ?? 0) / 100).toFixed(2)}`}
                      </div>
                    </div>
                    <span className={`games-profile__session-status ${session.status}`}>{session.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="games-profile__card games-profile__bio">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <h2 className="games-profile__card-title" style={{ margin: 0 }}>
              About
            </h2>
            {!isEditingBio ? (
              <button
                type="button"
                className="games-profile__btn games-profile__btn--ghost games-profile__btn--small"
                onClick={() => {
                  setBioText(savedBio)
                  setIsEditingBio(true)
                }}
              >
                <Edit2 size={13} />
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="games-profile__btn games-profile__btn--primary games-profile__btn--small"
                  disabled={isSaving}
                  onClick={() => void handleSaveBio()}
                >
                  <Check size={13} />
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="games-profile__btn games-profile__btn--secondary games-profile__btn--small"
                  onClick={() => {
                    setBioText(savedBio)
                    setIsEditingBio(false)
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
          {isEditingBio ? (
            <div className="games-profile__bio-edit" style={{ marginTop: '0.75rem' }}>
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell other players about your skirmish style…"
                maxLength={2500}
              />
            </div>
          ) : (
            <p className="games-profile__bio-text" style={{ marginTop: '0.75rem' }}>
              {savedBio ||
                'No bio yet. Your biography is shared with Kanban — edit it here or in workspace settings.'}
            </p>
          )}
        </section>

        <p className="games-profile__footer-note">
          Profile, storage, and folders are linked to your Espeezy account across Games and Kanban.
        </p>
      </div>
    </main>
  )
}
