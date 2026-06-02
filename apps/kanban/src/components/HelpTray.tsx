"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookOpen, LifeBuoy, ArrowRight, ExternalLink } from "lucide-react";
import {
  HELP_TRAY_CTA_LABEL,
  HELP_TRAY_TITLE,
  KANBAN_HELP_GUIDES,
} from "@shared/app-ui-copy";
import { espeezyDocsUrl } from "@shared/espeezy-marketing-links";
import AppCopyrightStrip from "@shared/AppCopyrightStrip";
import { isExternalNavUrl } from "@/lib/nav/resolve-nav-url";
import "./help-tray.css";

const DOCS_QUICK_START = espeezyDocsUrl("/docs/getting-started");

function HelpTrayLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string
  className: string
  onClick: () => void
  children: React.ReactNode
}) {
  if (isExternalNavUrl(href)) {
    return (
      <a href={href} className={className} onClick={onClick} target="_blank" rel="noopener noreferrer">
        {children}
        <ExternalLink size={14} aria-hidden style={{ marginLeft: 4 }} />
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

export default function HelpTray() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-help-tray", handler);
    return () => window.removeEventListener("open-help-tray", handler);
  }, []);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="help-tray-backdrop"
        aria-label="Close help"
        onClick={() => setOpen(false)}
      />
      <aside className="help-tray-panel" aria-label="Help and onboarding">
        <header className="help-tray-header">
          <div className="help-tray-header-title">
            <span className="help-tray-header-icon" aria-hidden>
              <LifeBuoy size={20} />
            </span>
            {HELP_TRAY_TITLE}
          </div>
          <button
            type="button"
            className="help-tray-close"
            aria-label="Close help"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </header>
        <div className="help-tray-body">
          <h3 className="help-tray-lead-title">How can we help?</h3>
          <p className="help-tray-lead">
            Browse feature guides, search the <Link href="/ask">Ask directory</Link>, or open the{' '}
            <a href={DOCS_QUICK_START} target="_blank" rel="noopener noreferrer" className="help-tray-inline-link">
              {HELP_TRAY_CTA_LABEL} <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </a>
            .
          </p>
          <div className="help-tray-list">
            {KANBAN_HELP_GUIDES.map((f) =>
              f.actionEvent ? (
                <button
                  key={f.title}
                  type="button"
                  className="help-tray-card"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(new CustomEvent(f.actionEvent!));
                  }}
                >
                  <div className="help-tray-card-title">
                    <BookOpen size={16} />
                    <span>{f.title}</span>
                  </div>
                  <p className="help-tray-card-desc">{f.desc}</p>
                </button>
              ) : (
                <HelpTrayLink
                  key={f.title}
                  href={f.link}
                  className="help-tray-card"
                  onClick={() => setOpen(false)}
                >
                  <div className="help-tray-card-title">
                    <BookOpen size={16} />
                    <span>{f.title}</span>
                  </div>
                  <p className="help-tray-card-desc">{f.desc}</p>
                </HelpTrayLink>
              )
            )}
          </div>
        </div>
        <footer className="help-tray-footer">
          <a
            href={DOCS_QUICK_START}
            className="help-tray-cta"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            {HELP_TRAY_CTA_LABEL} <ArrowRight size={16} />
          </a>
          <AppCopyrightStrip style={{ marginTop: "1rem", color: "#64748b" }} />
        </footer>
      </aside>
    </>
  );
}
