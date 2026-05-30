import React from 'react';

export default function GlobalFooter() {
  return (
    <footer className="global-footer">
      <div className="global-footer__content">
        <span>© {new Date().getFullYear()} Espeezy Studios</span>
        <span className="global-footer__links">
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
          <span>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
          <span>·</span>
          <a href="https://github.com/espeezy" target="_blank" rel="noopener noreferrer">GitHub</a>
        </span>
      </div>
    </footer>
  );
}
