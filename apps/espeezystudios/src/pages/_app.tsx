import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Sidebar from '../components/Sidebar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" className="main" tabIndex={-1}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
