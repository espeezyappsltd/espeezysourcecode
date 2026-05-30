
import React from 'react';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espeezy Studios',
  description: 'Dashboard and management for Espeezy Studios',
};  

import GlobalFooter from '../components/GlobalFooter';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}
