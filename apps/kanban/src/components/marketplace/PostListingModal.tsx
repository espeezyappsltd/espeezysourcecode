'use client'

import React, { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useNotifications } from '@/components/NotificationProvider'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { marketplaceListingPublishCopy } from '@/lib/platform/transaction-confirm-copy'
import { ListingCondition } from '@/types/marketplace'
import { MAX_ASSET_CREDIT_VALUE, formatCreditCapHint } from '@/lib/credits'
import { FormCheck, FormField } from '@/components/forms/FormField'

interface PostListingModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function PostListingModal({ onClose, onSuccess }: PostListingModalProps) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [category, setCategory] = useState('Electronics')
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<ListingCondition>('Used')
  const [meetupZone, setMeetupZone] = useState('Library')
  const [meetupDetails, setMeetupDetails] = useState('')
  const [duration, setDuration] = useState(14)
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5))
    }
  }

  const handlePost = async () => {
    if (!agreed) {
      addToast('Policy required', 'Confirm the marketplace policy to publish.', 'warning')
      return
    }
    const priceCredits = Math.max(0, parseInt(price, 10) || 0)
    const ok = await confirmTransaction(marketplaceListingPublishCopy(title.trim(), priceCredits))
    if (!ok) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('price', price)
      formData.append('category', category)
      formData.append('quantity', String(quantity))
      formData.append('condition', condition)
      formData.append('meetup_zone', meetupZone)
      formData.append('meetup_details', meetupDetails)
      formData.append('duration_days', String(duration))
      images.forEach((img) => formData.append('images', img))

      const res = await fetch('/api/marketplace/listings', { method: 'POST', credentials: 'include', body: formData })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      addToast('Listed', 'Item is live. Buyers pay with Espeezy credits.', 'success')
      onSuccess()
    } catch (err: unknown) {
      addToast('Upload failed', err instanceof Error ? err.message : 'Unknown error', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="post-listing-title">
      <button type="button" className="app-modal-backdrop" aria-label="Close post listing dialog" onClick={onClose} />
      <div className="app-modal-panel app-modal-panel--narrow">
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 id="post-listing-title" style={{ margin: 0, fontWeight: 950 }}>
            List item
          </h2>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--text-sub)' }}>
            Espeezy credits checkout only · step {step}/2
          </p>
        </div>
        <div className="app-modal-panel__scroll" style={{ padding: '1.25rem 1.5rem', maxHeight: 'min(60vh, 70dvh)' }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <FormField label="Listing title" required>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoComplete="off"
                  maxLength={120}
                />
              </FormField>
              <FormField label="Description" required hint="At least 10 characters">
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <FormField label="Category" required>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {['Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Condition" required>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)}>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Price in credits" required hint={formatCreditCapHint()}>
                <input
                  type="number"
                  min={0}
                  max={MAX_ASSET_CREDIT_VALUE}
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </FormField>
              <FormField label="Meetup zone" required>
                <select value={meetupZone} onChange={(e) => setMeetupZone(e.target.value)}>
                  <option value="Library">Library</option>
                  <option value="Student Union">Student Union</option>
                  <option value="Science Hub">Science Hub</option>
                  <option value="Cafeteria">Cafeteria</option>
                </select>
              </FormField>
              <FormField label="Listing photos" hint={`${images.length} of 5 selected. JPEG or PNG.`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="form-input form-input--file"
                />
              </FormField>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <AlertTriangle style={{ margin: '0 auto 0.5rem' }} aria-hidden />
              <FormCheck
                id="mp-policy-agree"
                label="I agree to the marketplace policy"
                checked={agreed}
                onChange={setAgreed}
                required
              />
            </div>
          )}
        </div>
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={() => (step > 1 ? setStep(1) : onClose())}>
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step === 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={uploading} onClick={() => void handlePost()}>
              {uploading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
