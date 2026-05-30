import GlobalFooter from '../../components/GlobalFooter';

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow mb-8">
          <p className="mb-4">To complete your booking, please use the secure payment link below:</p>
          <a
            href="https://buy.stripe.com/3cIaEX0Da5mMaXee5W7wA0h"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition"
          >
            Proceed to Secure Payment
          </a>
        </div>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          <h2 className="text-lg font-semibold mb-2">Legal</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms & Conditions</a>
            </li>
            <li>
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>
            </li>
            <li>
              <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Refund Policy</a>
            </li>
          </ul>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
