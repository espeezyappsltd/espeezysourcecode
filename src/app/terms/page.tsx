import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Espeezy',
  description: 'Terms of Service for Espeezy.',
}

export default function TermsPage() {
  return (
    <main style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.25rem 4rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Terms of Service</h1>
      <p>
        These Terms govern use of Espeezy. By using the platform, you agree to these terms.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Service Overview</h2>
      <p>
        Espeezy provides collaboration and workflow tools for students, teams, and organizations.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Accounts and Access</h2>
      <p>
        You are responsible for safeguarding your account credentials and for activity under your account.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Payments</h2>
      <p>
        Paid features are billed through Stripe. Pricing, billing intervals, and cancellation policies are
        shown at checkout.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Acceptable Use</h2>
      <p>
        You agree not to misuse the platform, interfere with service operations, or violate applicable law.
      </p>

      <h2 style={{ marginTop: '2rem' }}>Contact</h2>
      <p>
        Questions about these terms can be sent to support@espeezy.com.
      </p>

      <p style={{ marginTop: '2rem', opacity: 0.8 }}>Last updated: April 21, 2026</p>
    </main>
  )
}
