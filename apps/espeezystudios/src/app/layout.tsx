
import '../app/globals.css';
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
