import GlobalFooter from '../../components/GlobalFooter';

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Refund Policy</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          <p>Refunds are available within 7 days of purchase if no work has begun on your project. For refund requests, contact support@espeezy.com with your order details.</p>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
