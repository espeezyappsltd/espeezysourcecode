import type { Metadata } from 'next';
import './globals.css';
import './prestige.css';
import { NotificationProvider } from '../components/NotificationProvider';
import PWARegistry from '../components/PWARegistry';
import SessionGuard from '@/components/SessionGuard';
import { ConnectivityProvider } from '@/context/ConnectivityContext';
import ToasterModeManager from '@/components/ToasterModeManager';
import ClientShell from '@/components/ClientShell';
import type { Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Espeezy - Team Projects Made Simple',
  description: 'The easiest way for students to work together on group projects.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Espeezy',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical preconnects — reduce first-auth latency */}
        <link rel="preconnect" href="https://othntbcrtmemavfsslrb.db.co" />
        <link rel="dns-prefetch" href="https://othntbcrtmemavfsslrb.db.co" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      </head>
      <body suppressHydrationWarning>
        <ConnectivityProvider>
          <ToasterModeManager />
          <NotificationProvider>
            <PWARegistry />
            {children}
            <ClientShell />
            <SessionGuard />
          </NotificationProvider>
        </ConnectivityProvider>

        {/* PREMIUM SVG FILTERS */}
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
          <defs>
            <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="elite-shimmer" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feColorMatrix type="saturate" values="1.5" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
