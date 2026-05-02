import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Espeezy',
  description: 'Privacy Policy for Espeezy.',
}

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.25rem 4rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Privacy Policy</h1>
      <p>
        This policy explains what information Espeezy collects, how we use it, and your choices.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Data We Collect</h2>
      <p>
        We collect account details, usage data, and payment-related metadata needed to operate the service.
      </p>

      <h2 style={{ marginTop: '2rem' }}>How We Use Data</h2>
      <p>
        We use data to provide platform features, improve reliability, secure accounts, and support customers.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Payments</h2>
      <p>
        Payment processing is handled by Stripe. We do not store full card numbers on our servers.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Your Rights</h2>
      <p>
        You may request access, correction, or deletion of personal data by contacting support@espeezy.com.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Contact</h2>
      <p>
        Privacy questions can be sent to support@espeezy.com.
      </p>

      <p style={{ marginTop: '2rem', opacity: 0.8 }}>Last updated: April 21, 2026</p>
    </main>
  )
}
