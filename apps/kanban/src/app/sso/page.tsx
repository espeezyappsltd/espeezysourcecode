import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SSOPageInner() {
  const searchParams = useSearchParams();
  // You can use searchParams here as needed
  return <div>SSO Page (placeholder)</div>;
}

export default function SSOPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SSOPageInner />
    </Suspense>
  );
}
