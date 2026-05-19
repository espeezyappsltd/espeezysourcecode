'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Coins, X, Shield, Calendar } from 'lucide-react'
import type { HustleTaskWithProfiles } from '@/lib/hustle/task-enrich'
import type { HustleApplication } from '@/services/hustle'
import { fetchHustleTask, hustleTrade } from '@/services/hustle'
import { formatCredits, formatGbpApprox } from '@/lib/credits'
import { breakdownPlatformFee } from '@/lib/platform/fees'
import { formatHustleCategory } from '@/lib/hustle/task-validation'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { hustleTradeCopy } from '@/lib/platform/transaction-confirm-copy'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import { APPLICATION_STATUS_LABELS } from '@/lib/hustle/lifecycle'
import { getPosterGigNextAction, getWorkerGigNextAction } from '@/lib/hustle/gig-ux'
import { HustleLifecycleBar } from '@/components/hustle/HustleLifecycleBar'
import { HustleNextActionBanner } from '@/components/hustle/HustleNextActionBanner'
import RemoteAvatar from '@/components/common/RemoteAvatar'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'

const SUCCESS_MESSAGES: Partial<Record<Parameters<typeof hustleTrade>[1], string>> = {
  fund: 'Escrow funded — credits are secured until the gig completes.',
  accept: 'Worker hired. They can start when escrow is ready.',
  start: 'You started work on this gig.',
  submit: 'Submitted for review. The poster can approve and release payment.',
  approve: 'Payment released to the worker.',
  cancel: 'Gig cancelled. Escrow refunded when applicable.',
}

type Props = {
  taskId: string
  onClose: () => void
  onUpdated: () => void
  onViewMyGigs?: () => void
  onGigsListChanged?: () => void
}

export function HustleTaskModal({ taskId, onClose, onUpdated, onViewMyGigs, onGigsListChanged }: Props) {
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const { showConfirmation } = useSmartLoading()
  const [task, setTask] = useState<HustleTaskWithProfiles | null>(null)
  const [applications, setApplications] = useState<HustleApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [myApplication, setMyApplication] = useState<HustleApplication | null>(null)

  const uid = profile?.id
  const isPoster = Boolean(uid && task?.poster_id === uid)
  const isAssignee = Boolean(uid && task?.assignee_id === uid)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchHustleTask(taskId)
      setTask(data.task ?? null)
      setApplications(data.applications ?? [])
      setMyApplication(data.my_application ?? null)
    } catch (e) {
      addToast('Load failed', e instanceof Error ? e.message : 'Could not load task', 'error')
      onClose()
    } finally {
      setLoading(false)
    }
  }, [taskId, addToast, onClose])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const runWithConfirm = async (
    action: Parameters<typeof hustleTrade>[1],
    extra?: { applicant_id?: string; message?: string; applicantName?: string },
  ) => {
    if (!task) return
    const credits = task.payout_credits ?? task.escrow_credits ?? 0
    const copy = hustleTradeCopy(action, {
      taskTitle: task.title,
      credits: action === 'approve' || action === 'cancel' ? task.escrow_credits || credits : credits,
      applicantName: extra?.applicantName,
    })
    const ok = await confirmTransaction(copy)
    if (!ok) return
    await run(action, extra)
  }

  const run = async (
    action: Parameters<typeof hustleTrade>[1],
    extra?: { applicant_id?: string; message?: string },
  ) => {
    setBusy(action)
    try {
      const result = await hustleTrade(taskId, action, extra)
      if (result.task) setTask(result.task)
      if (result.application) setMyApplication(result.application)

      if (action === 'apply' && result.task) {
        showConfirmation({
          title: 'Application sent',
          message: `You're on the list for "${result.task.title}". Track escrow, status, and next steps in My gigs.`,
          type: 'success',
          confirmLabel: 'View my gigs',
          cancelLabel: 'Close',
          onConfirm: () => {
            onGigsListChanged?.()
            onViewMyGigs?.()
            onClose()
          },
          onCancel: () => {
            onGigsListChanged?.()
            onUpdated()
          },
        })
        return
      }

      addToast(
        'Done',
        SUCCESS_MESSAGES[action] ?? `Completed: ${action}`,
        'success',
      )
      onGigsListChanged?.()
      onUpdated()
      await load()
    } catch (e) {
      addToast('Action failed', e instanceof Error ? e.message : 'Try again', 'error')
    } finally {
      setBusy(null)
    }
  }

  if (loading || !task) {
    return (
      <div className="app-modal-overlay">
        <div className="app-modal-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    )
  }

  const funded = (task.escrow_credits ?? 0) >= task.payout_credits
  const credits = task.payout_credits
  const payoutFee = breakdownPlatformFee(credits)

  const gigItem = {
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    created_at: task.created_at,
    updated_at: task.updated_at,
    payout_credits: task.payout_credits,
    escrow_credits: task.escrow_credits,
    my_role: isAssignee ? ('assignee' as const) : myApplication ? ('applicant' as const) : undefined,
    application_status: myApplication?.status ?? (isAssignee ? 'accepted' : null),
  }
  const nextAction = isPoster
    ? getPosterGigNextAction(gigItem)
    : !isPoster && uid
      ? getWorkerGigNextAction(gigItem)
      : null

  const deadlineLabel =
    task.deadline &&
    new Date(task.deadline).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="hustle-task-title">
      <button type="button" className="app-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="app-modal-panel app-modal-panel--narrow">
        <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div style={{ padding: '1.25rem 1.5rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {task.poster && (
              <RemoteAvatar
                src={avatarUrlForProfile({
                  id: task.poster.id,
                  full_name: task.poster.full_name,
                  username: task.poster.username,
                  avatar_url: task.poster.avatar_url,
                })}
                alt=""
                size={44}
                fallback={<span>{task.poster.full_name?.[0] ?? '?'}</span>}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id="hustle-task-title" style={{ margin: 0, fontWeight: 950, fontSize: '1.1rem' }}>
                {task.title}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                {formatHustleCategory(task.category)} · {task.status.replace('_', ' ')}
                {deadlineLabel ? (
                  <>
                    {' '}
                    · <Calendar size={11} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
                    Due {deadlineLabel}
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <div className="hustle-modal-credits">
            <Coins size={22} style={{ color: 'var(--brand)' }} aria-hidden />
            <div>
              <div className="hustle-modal-credits__value">{formatCredits(credits)}</div>
              <div className="hustle-modal-credits__sub">{formatGbpApprox(credits)}</div>
            </div>
            <span className={`hustle-modal-escrow${funded ? ' hustle-modal-escrow--ok' : ''}`}>
              <Shield size={14} aria-hidden />
              {funded ? 'Escrow funded' : 'Escrow pending'}
            </span>
          </div>
        </div>
        <div className="app-modal-panel__scroll" style={{ padding: '1rem 1.5rem 0' }}>
          <HustleLifecycleBar status={task.status} compact />
          {nextAction ? <HustleNextActionBanner action={nextAction} /> : null}
          <p style={{ margin: '0 0 1rem', lineHeight: 1.6, fontSize: '0.9rem', color: 'var(--text-sub)' }}>
            {task.description}
          </p>

          {myApplication && !isPoster && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(var(--brand-rgb), 0.08)',
                border: '1px solid rgba(var(--brand-rgb), 0.2)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand)' }}>
                {APPLICATION_STATUS_LABELS[myApplication.status] ?? myApplication.status}
              </p>
              {myApplication.message ? (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                  Your note: {myApplication.message}
                </p>
              ) : null}
            </div>
          )}

          {!isPoster &&
            task.status === 'open' &&
            uid &&
            (!myApplication || myApplication.status === 'rejected') && (
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Optional message to poster…"
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={busy !== null}
                onClick={() => void runWithConfirm('apply', { message: applyMessage })}
              >
                {busy === 'apply' ? <Loader2 size={16} className="animate-spin" /> : null}
                Apply for this gig
              </button>
            </div>
          )}

          {isPoster && applications.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h3
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: 'var(--text-sub)',
                  marginBottom: '0.5rem',
                }}
              >
                Applicants
              </h3>
              <ul className="hustle-applicants">
                {applications
                  .filter((a) => a.status === 'pending')
                  .map((app) => (
                    <li key={app.id} className="hustle-applicant-row">
                      <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                        {app.applicant?.full_name ?? 'Scholar'}
                      </span>
                      {app.message ? (
                        <p style={{ margin: '0.2rem 0', fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                          {app.message}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={busy !== null}
                        onClick={() =>
                          void runWithConfirm('accept', {
                            applicant_id: app.applicant_id,
                            applicantName: app.applicant?.full_name ?? undefined,
                          })
                        }
                      >
                        Accept
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="hustle-modal-footer hustle-modal-actions">
            {isPoster && !funded && task.status === 'open' && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy !== null}
                onClick={() => void runWithConfirm('fund')}
              >
                Fund escrow
              </button>
            )}
            {isAssignee && task.status === 'assigned' && (
              <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => void runWithConfirm('start')}>
                Start work
              </button>
            )}
            {isAssignee && (task.status === 'in_progress' || task.status === 'assigned') && (
              <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => void runWithConfirm('submit')}>
                Submit for review
              </button>
            )}
            {isPoster && task.status === 'submitted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
                {payoutFee.platformFeeCredits > 0 && (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                    Worker receives {formatCredits(payoutFee.netCredits)} after{' '}
                    {payoutFee.platformFeeCredits} cr platform fee (1 per 50 cr)
                  </p>
                )}
                <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={() => void runWithConfirm('approve')}>
                  Approve & release escrow
                </button>
              </div>
            )}
            {isPoster && task.status !== 'paid' && task.status !== 'cancelled' && (
              <button type="button" className="btn btn-ghost" disabled={busy !== null} onClick={() => void runWithConfirm('cancel')}>
                Cancel task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
