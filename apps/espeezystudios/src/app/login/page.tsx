import React from 'react';
import GlobalFooter from '../../components/GlobalFooter';

export default function StudioLoginPage() {
  // TODO: Implement studio login and dashboard redirect
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 w-full max-w-md mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Studio Login</h1>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-800 shadow">
          <p className="text-neutral-500">Studio staff, please log in to access the dashboard.</p>
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}
