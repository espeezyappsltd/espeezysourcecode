import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Espeezy',
  description: 'Terms of Service for Espeezy.',
}

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '5rem 1.5rem 4rem', lineHeight: 1.7 }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '2.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>← Back to Home</Link>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '3rem' }}>Last updated: April 21, 2026</p>

        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          These Terms govern your use of Espeezy. By using the platform, you agree to these terms in full.
        </p>

        {[
          {
            title: 'Service Overview',
            body: 'Espeezy provides collaboration, workflow, and learning management tools for students, teams, and educational organisations. Core features are free for all students. Premium features may require a paid subscription.',
          },
          {
            title: 'Accounts and Access',
            body: 'You are responsible for safeguarding your account credentials and for all activity that occurs under your account. You must be at least 13 years old to use Espeezy. You must provide accurate information when creating an account.',
          },
          {
            title: 'Payments',
            body: 'Paid features are billed through Stripe. Pricing, billing intervals, and cancellation policies are shown at checkout. All charges are in USD unless otherwise stated. Refunds are issued at our discretion in accordance with our refund policy.',
          },
          {
            title: 'Acceptable Use',
            body: 'You agree not to misuse the platform, interfere with service operations, upload harmful content, attempt to gain unauthorised access to any system, or violate applicable law. Violations may result in immediate account termination.',
          },
          {
            title: 'Intellectual Property',
            body: 'Espeezy and its original content, features, and functionality are owned by Espeezy Ltd and are protected by international intellectual property laws. Your data remains yours — you grant us a limited licence to store and process it to provide the service.',
          },
          {
            title: 'Limitation of Liability',
            body: 'Espeezy is provided "as is" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you have paid us in the preceding 12 months.',
          },
          {
            title: 'Changes to Terms',
            body: 'We may update these terms from time to time. Material changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance.',
          },
          {
            title: 'Contact',
            body: 'Questions about these terms can be sent to support@espeezy.com.',
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
