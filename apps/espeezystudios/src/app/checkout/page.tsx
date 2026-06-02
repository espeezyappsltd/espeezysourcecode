import StudioPageShell from '@/components/StudioPageShell'

export default function CheckoutPage() {
  return (
    <StudioPageShell
      title="Checkout"
      description="Complete your booking through our secure Stripe payment link."
    >
      <div className="studio-panel">
        <p className="studio-panel__lead">Use the link below to proceed to payment.</p>
        <a
          href="https://buy.stripe.com/3cIaEX0Da5mMaXee5W7wA0h"
          target="_blank"
          rel="noopener noreferrer"
          className="studio-btn studio-btn--primary"
        >
          Proceed to secure payment
        </a>
      </div>
      <div className="studio-panel">
        <h2 className="studio-panel__heading">Legal</h2>
        <ul className="studio-link-list">
          <li>
            <a href="/terms">Terms & Conditions</a>
          </li>
          <li>
            <a href="/privacy">Privacy Policy</a>
          </li>
          <li>
            <a href="/refund">Refund Policy</a>
          </li>
        </ul>
      </div>
    </StudioPageShell>
  )
}
