import React from 'react';
import GlobalFooter from '../../components/GlobalFooter';

export default function ClientsPage() {
  // TODO: Implement client login, job filtering, progress, download, messaging, and call features
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Client Portal</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          <p className="text-neutral-500">Log in to view your job, progress, download files, or contact us.</p>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
