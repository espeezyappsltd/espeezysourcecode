import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Espeezy',
  description: 'Privacy Policy for Espeezy.',
}

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '5rem 1.5rem 4rem', lineHeight: 1.7 }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '2.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>← Back to Home</Link>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '3rem' }}>Last updated: April 21, 2026</p>

        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          This policy explains what information Espeezy collects, how we use it, and your rights as a user.
        </p>

        {[
          {
            title: 'Data We Collect',
            body: 'We collect account details (name, email, institution), usage data (pages visited, features used, timestamps), and payment-related metadata needed to operate the service. We do not collect full payment card numbers.',
          },
          {
            title: 'How We Use Data',
            body: 'We use data to provide platform features, improve reliability, secure your account, detect fraud, and provide customer support. We do not sell your personal data to third parties.',
          },
          {
            title: 'Payments',
            body: 'Payment processing is handled by Stripe Inc. We store only a tokenised reference to your payment method. Full card details are never stored on our servers. See stripe.com/privacy for Stripe\'s data practices.',
          },
          {
            title: 'Cookies & Tracking',
            body: 'We use session cookies for authentication and local storage for user preferences. We do not use third-party advertising trackers. Analytics data is anonymised and used only to improve the product.',
          },
          {
            title: 'Data Retention',
            body: 'Active account data is retained as long as your account exists. After account deletion, personal data is purged within 30 days, except where required by law (e.g. financial records which must be kept for 7 years).',
          },
          {
            title: 'Your Rights',
            body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting support@espeezy.com. EU/UK users have rights under GDPR including the right to data portability and the right to object to processing.',
          },
          {
            title: 'International Transfers',
            body: 'Your data may be processed in the European Union and the United States. We use standard contractual clauses and equivalent safeguards for any cross-border transfers.',
          },
          {
            title: 'Changes to This Policy',
            body: 'We may update this policy periodically. Material changes will be communicated via email. Continued use after changes constitutes acceptance.',
          },
          {
            title: 'Contact',
            body: 'Privacy questions can be sent to support@espeezy.com.',
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2.25rem', paddingBottom: '2.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f3f4f6', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{section.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.925rem' }}>{section.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
