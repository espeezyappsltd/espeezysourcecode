"use client";

import React from 'react';
import {
  COPYRIGHT_STUDIOS_PRODUCT,
  FOOTER_LEGAL_LINKS,
  FOOTER_TRADEMARK_NOTICE,
  formatCopyrightNotice,
} from '@shared/platform-legal';

export default function GlobalFooter() {
  return (
    <footer className="global-footer">
      <div className="global-footer__content">
        <div className="global-footer__legal">
          <span className="global-footer__copyright">
            {formatCopyrightNotice({ product: COPYRIGHT_STUDIOS_PRODUCT })}
          </span>
          <p className="global-footer__trademark">{FOOTER_TRADEMARK_NOTICE}</p>
          <span className="global-footer__links">
            {FOOTER_LEGAL_LINKS.map(({ href, label }, index) => (
              <React.Fragment key={href}>
                {index > 0 ? <span aria-hidden>·</span> : null}
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
