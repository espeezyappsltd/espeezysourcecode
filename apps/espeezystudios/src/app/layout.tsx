
import React from 'react';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espeezy Studios',
  description: 'Dashboard and management for Espeezy Studios',
};  

import GlobalFooter from '../components/GlobalFooter';
import AppsNav from '../components/AppsNav';
import GalleryNav from '../components/GalleryNav';
import Sidebar from '../components/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppsNav />
        <GalleryNav />
        <Sidebar />
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}
