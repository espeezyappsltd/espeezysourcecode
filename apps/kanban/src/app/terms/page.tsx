import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Espeezy',
  description: 'Terms of Service for Espeezy.',
}

const SECTIONS = [
  {
    title: 'Service Overview',
    body: 'Espeezy provides collaboration and workflow tools for students, teams, and organizations. We offer features including task management, contribution tracking, group project coordination, real-time communication, AI-assisted learning, and marketplace functionality.',
  },
  {
    title: 'Accounts and Access',
    body: 'You are responsible for safeguarding your account credentials and for all activity that occurs under your account. You must be at least 16 years of age to use Espeezy. Institutional accounts are subject to any additional terms agreed with the institution.',
  },
  {
    title: 'Intellectual Property',
    body: "Content you create on Espeezy remains yours. You grant Espeezy a licence to store, process, and display that content solely for the purpose of operating the service. Espeezy's platform, brand, and underlying technology are owned by Espeezy and may not be copied or redistributed.",
  },
  {
    title: 'Payments and Billing',
    body: 'Paid features are billed through Stripe Inc. Pricing, billing intervals, and cancellation policies are shown at checkout. Subscriptions auto-renew unless cancelled before the renewal date. We do not issue refunds for partial billing periods except where required by law.',
  },
  {
    title: 'Acceptable Use',
    body: 'You agree not to misuse the platform, interfere with service operations, attempt to gain unauthorised access to any system, upload malicious content, engage in harassment, or violate applicable law. Violations may result in immediate account suspension.',
  },
  {
    title: 'Termination',
    body: 'Either party may terminate the agreement at any time. You may delete your account via the settings page. Espeezy may suspend or terminate accounts that breach these terms. Upon termination, your right to use the service ends immediately.',
  },
  {
    title: 'Limitation of Liability',
    body: 'Espeezy is provided on an "as is" basis. To the maximum extent permitted by law, Espeezy is not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid in the twelve months preceding the claim.',
  },
  {
    title: 'Governing Law',
    body: 'These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer in the EU or UK, you retain any statutory rights that cannot be excluded under applicable law.',
  },
  {
    title: 'Contact',
    body: 'Questions about these terms can be sent to support@espeezy.com. We aim to respond within 3 business days.',
  },
]

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white' }}>
      <div className="page-shell page-shell--standalone" style={{ lineHeight: 1.7 }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '2.5rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
          &larr; Back to Home
        </Link>
        <h1 className="page-header__title" style={{ marginBottom: '0.75rem' }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '3rem' }}>Last updated: April 21, 2026</p>

        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2.5rem' }}>
          By accessing or using Espeezy, you agree to be bound by these Terms of Service. Please read them carefully.
        </p>

        {SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: '2.25rem', paddingBottom: '2.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f3f4f6', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{section.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>{section.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

