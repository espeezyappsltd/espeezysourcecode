'use client'

import { useState } from 'react'
import { Loader2, Coins } from 'lucide-react'
import { HUSTLE_CATEGORIES, type HustleCategory } from '@/lib/hustle/task-validation'
import { MAX_ASSET_CREDIT_VALUE, formatCreditCapHint } from '@/lib/credits'
import { formatPlatformFeeHint } from '@/lib/platform/fees'
import { createHustleTask } from '@/services/hustle'
import { useNotifications } from '@/components/NotificationProvider'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { hustlePostCopy } from '@/lib/platform/transaction-confirm-copy'

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function PostHustleModal({ onClose, onCreated }: Props) {
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HustleCategory>('coding')
  const [payoutCredits, setPayoutCredits] = useState('15')
  const [fundNow, setFundNow] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const credits = parseInt(payoutCredits, 10)
    if (!title.trim() || description.trim().length < 20) {
      addToast('Invalid gig', 'Add a title and at least 20 characters of description.', 'error')
      return
    }
    if (!Number.isFinite(credits) || credits < 1 || credits > MAX_ASSET_CREDIT_VALUE) {
      addToast('Invalid payout', formatCreditCapHint(), 'error')
      return
    }

    const ok = await confirmTransaction(
      hustlePostCopy(title.trim(), credits, fundNow),
    )
    if (!ok) return

    setSubmitting(true)
    try {
      await createHustleTask({
        title: title.trim(),
        description: description.trim(),
        category,
        payout_credits: credits,
        fund_now: fundNow,
      })
      addToast('Gig posted', fundNow ? 'Escrow funded — workers can apply now.' : 'Fund escrow when you accept a worker.', 'success')
      onCreated()
      onClose()
    } catch (e) {
      addToast('Post failed', e instanceof Error ? e.message : 'Try again', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="post-hustle-title">
      <button type="button" className="app-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="app-modal-panel app-modal-panel--narrow">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 id="post-hustle-title" style={{ margin: 0, fontWeight: 950 }}>
            Post a campus gig
          </h2>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-sub)' }}>
            Pay in Espeezy credits · escrow protects both sides
          </p>
        </div>
        <div className="app-modal-panel__scroll" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="form-input"
            rows={4}
            placeholder="What should the worker deliver? (min 20 chars)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value as HustleCategory)}>
            {HUSTLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Coins size={18} style={{ color: 'var(--brand)' }} aria-hidden />
            <input
              className="form-input"
              type="number"
              min={1}
              max={MAX_ASSET_CREDIT_VALUE}
              value={payoutCredits}
              onChange={(e) => setPayoutCredits(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)' }}>credits</span>
          </label>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-sub)' }}>{formatCreditCapHint()}</p>
          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-sub)' }}>
            {formatPlatformFeeHint(parseInt(payoutCredits, 10) || 0)}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            <input type="checkbox" checked={fundNow} onChange={(e) => setFundNow(e.target.checked)} />
            Fund escrow now (recommended)
          </label>
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Post gig
          </button>
        </div>
      </div>
    </div>
  )
}
