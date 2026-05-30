"use client";

import React from 'react';

export default function GlobalFooter() {
  return (
    <footer className="global-footer *" style={{ backgroundColor: '#000', padding: '1rem 0', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
      <div className="global-footer__content">
        <span>© {new Date().getFullYear()} Espeezy Studios</span>
        <span className="global-footer__links">
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
          <span>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
          <span>·</span>
          <a href="https://github.com/EspeezyTeam" target="_blank" rel="noopener noreferrer">GitHub</a>
        </span>
      </div>
    </footer>
  );
}
