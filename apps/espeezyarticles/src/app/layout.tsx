import './globals.css';
import type { Metadata } from 'next';
import { PLATFORM_ONE_LINER } from '@shared/platform-brand';

export const metadata: Metadata = {
  title: 'Espeezy Articles',
  description: 'Published articles and essays from the Espeezy community. ' + PLATFORM_ONE_LINER,
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
