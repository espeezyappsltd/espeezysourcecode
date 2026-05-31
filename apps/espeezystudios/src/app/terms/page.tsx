import StudioPageShell from '@/components/StudioPageShell'

export default function TermsPage() {
  return (
    <StudioPageShell title="Terms & Conditions">
      <div className="studio-panel studio-panel--prose">
        <p>
          By using Espeezy Studios, you agree to our terms and conditions. Please review all service
          details, payment terms, and project scope before purchase. For questions, contact{' '}
          <a href="mailto:support@espeezy.com">support@espeezy.com</a>.
        </p>
      </div>
    </StudioPageShell>
  )
}
