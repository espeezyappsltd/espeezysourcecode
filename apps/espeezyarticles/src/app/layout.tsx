import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espeezy Articles',
  description: 'Public articles and blog section for Espeezy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
