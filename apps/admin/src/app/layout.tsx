import type { Metadata } from 'next';
import './globals.css';
import './prestige.css';
import { ConnectivityProvider } from '@/context/ConnectivityContext';
import AppRuntimeShell from '@/components/AppRuntimeShell';
import type { Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://panel.espeezy.com'),
  title: 'Espeezy Panel — Staff Console',
  description: 'Staff administration console for the Espeezy platform at panel.espeezy.com.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Espeezy',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p==='/login'||p.indexOf('/admin')===0)document.documentElement.classList.add('admin-theme-dark')}catch(e){}})();`,
          }}
        />
        {/* Critical preconnects  -  reduce first-auth latency */}
        <link rel="preconnect" href="https://othntbcrtmemavfsslrb.db.co" />
        <link rel="dns-prefetch" href="https://othntbcrtmemavfsslrb.db.co" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      </head>
      <body suppressHydrationWarning>
        <ConnectivityProvider>
          <AppRuntimeShell>{children}</AppRuntimeShell>
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
