"use client";

import React from 'react';
import StudiosLogo from '@/components/StudiosLogo';

export default function GlobalFooter() {
  return (
    <footer className="global-footer">
      <div className="global-footer__content">
        <div className="global-footer__brand">
          <StudiosLogo variant="footer" />
          <span className="global-footer__copyright">© {new Date().getFullYear()}</span>
        </div>
        <span className="global-footer__links">
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy
          </a>
          <span aria-hidden>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Terms
          </a>
          <span aria-hidden>·</span>
          <a href="https://github.com/EspeezyTeam" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </span>
      </div>
    </footer>
  );
}
