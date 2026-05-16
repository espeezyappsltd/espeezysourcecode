import React from 'react'

export function StripeInstructions() {
  return (
    <div style={{ margin: '2rem 0', padding: '2rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
      <h2 style={{ fontWeight: 900, marginBottom: '1rem' }}>How to Get Paid & Withdraw</h2>
      <ol style={{ textAlign: 'left', margin: '0 auto', maxWidth: 600, fontSize: '1rem', lineHeight: 1.7 }}>
        <li><b>Connect your Stripe account:</b> Click <b>Connect with Stripe</b> and follow the secure onboarding flow. You’ll be redirected to Stripe to verify your identity and link your bank account.</li>
        <li><b>List your items:</b> Post items for sale on the marketplace. Buyers can pay securely via Stripe.</li>
        <li><b>Receive funds:</b> When your item sells, your earnings are credited to your Espeezy account balance.</li>
        <li><b>Withdraw funds:</b> Enter the amount to withdraw (minimum £1.00, up to your available balance) and click <b>Withdraw</b>. Funds are sent to your linked bank account via Stripe.</li>
        <li><b>Security:</b> All payments and withdrawals are processed by Stripe. Espeezy never stores your bank details. For support, contact <a href="mailto:support@espeezy.com">support@espeezy.com</a>.</li>
      </ol>
      <div style={{ marginTop: '2rem', color: 'var(--text-sub)', fontSize: '0.95rem' }}>
        <b>Note:</b> You must complete Stripe onboarding before you can withdraw funds. Withdrawals may take 1-2 business days to appear in your bank account.
      </div>
    </div>
  )
}
