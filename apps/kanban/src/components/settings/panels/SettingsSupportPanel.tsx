'use client'

import { CheckCircle2 } from 'lucide-react'
import { createUserFeedback } from '@/services/dashboard'
import { logActivity } from '@/utils/logging'
import type { SettingsPageViewModel } from '../settings-types'
import { FormField } from '@/components/forms/FormField'

export function SettingsSupportPanel({ vm }: { vm: SettingsPageViewModel }) {
  const {
    profile,
    feedbackSuccess,
    setFeedbackSuccess,
    feedbackCategory,
    setFeedbackCategory,
    feedbackMessage,
    setFeedbackMessage,
    submittingFeedback,
    setSubmittingFeedback,
    addToast,
    getErrorMessage,
  } = vm

  return (
    <div className="auth-card" style={{ maxWidth: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Send Feedback</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem' }}>Tell us how we can make Espeezy better for your team.</p>

      {feedbackSuccess ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'rgba(var(--brand-rgb), 0.05)',
            borderRadius: '24px',
            border: '1px dashed var(--brand)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              background: 'var(--brand)',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Thank you!</h3>
          <p style={{ color: 'var(--text-sub)', marginTop: '0.5rem' }}>
            Your feedback has been received and will be reviewed by our team.
          </p>
          <button
            type="button"
            onClick={() => {
              setFeedbackSuccess(false)
              setFeedbackMessage('')
            }}
            className="btn btn-secondary"
            style={{ marginTop: '1.5rem', width: 'auto' }}
          >
            Send more feedback
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FormField label="Category">
            <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)} style={{ background: 'var(--bg-sub)' }}>
              <option>Suggestion</option>
              <option>Bug Report</option>
              <option>General Comment</option>
              <option>Other</option>
            </select>
          </FormField>

          <FormField label="Message">
            <textarea
              style={{ minHeight: '150px', background: 'var(--bg-sub)', resize: 'vertical' }}
              placeholder="What's on your mind?"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
            />
          </FormField>

          <button
            type="button"
            className="btn btn-primary"
            disabled={submittingFeedback || !feedbackMessage.trim()}
            onClick={async () => {
              setSubmittingFeedback(true)
              try {
                if (!profile?.id) throw new Error('Missing profile context')
                await createUserFeedback(profile.id, feedbackMessage, feedbackCategory)

                setFeedbackSuccess(true)
                addToast('Feedback Received', 'Thank you for your input!', 'success')

                if (profile) {
                  logActivity(
                    profile.id,
                    profile.group_id || 'system',
                    'setting_updated',
                    `Submitted feedback: ${feedbackCategory}`,
                    { category: feedbackCategory },
                  )
                }
              } catch (err: unknown) {
                addToast('Submission Failed', getErrorMessage(err), 'error')
              } finally {
                setSubmittingFeedback(false)
              }
            }}
          >
            {submittingFeedback ? 'Sending...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
