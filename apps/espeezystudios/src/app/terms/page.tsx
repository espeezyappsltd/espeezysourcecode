import GlobalFooter from '../../components/GlobalFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Terms & Conditions</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          <p>By using Espeezy Studios, you agree to our terms and conditions. Please review all service details, payment terms, and project scope before purchase. For questions, contact support@espeezy.com.</p>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
