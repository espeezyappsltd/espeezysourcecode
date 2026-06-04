import './globals.css';
import './articles-site.css';
import '@shared/theme-cycle.css';
import '@shared/espeezy-appearance.css';
import type { Metadata } from 'next';
import { PLATFORM_ONE_LINER } from '@shared/platform-brand';
import ArticlesSiteNav from '@/components/ArticlesSiteNav';
import ArticlesSiteFooter from '@/components/ArticlesSiteFooter';
import { EspeezyThemeProvider } from '@shared/EspeezyThemeProvider';

export const metadata: Metadata = {
  title: 'Espeezy Articles — learning resources and community writing',
  description: 'Published articles and essays from the Espeezy community. ' + PLATFORM_ONE_LINER,
  authors: [{ name: 'Espeezy' }],
  creator: 'Espeezy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="articles-site">
        <EspeezyThemeProvider rootClassName="articles-theme-bridge">
          <ArticlesSiteNav />
          <main id="main-content" className="articles-site__main">
            {children}
          </main>
          <ArticlesSiteFooter />
        </EspeezyThemeProvider>
      </body>
    </html>
  );
}
