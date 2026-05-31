import StudioPageShell from '@/components/StudioPageShell'

export default function RefundPage() {
  return (
    <StudioPageShell title="Refund Policy">
      <div className="studio-panel studio-panel--prose">
        <p>
          Refunds are available within 7 days of purchase if no work has begun on your project. For
          refund requests, contact{' '}
          <a href="mailto:support@espeezy.com">support@espeezy.com</a> with your order details.
        </p>
      </div>
    </StudioPageShell>
  )
}
