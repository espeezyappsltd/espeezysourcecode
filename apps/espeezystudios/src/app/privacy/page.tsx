import GlobalFooter from '../../components/GlobalFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          <p>Your privacy is important to us. We only collect information necessary to provide our services and do not share your data with third parties except as required for project delivery or by law.</p>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
